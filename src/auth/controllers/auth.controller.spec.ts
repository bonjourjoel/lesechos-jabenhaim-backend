import * as request from 'supertest';

import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  TEST_PASSWORD,
  TEST_USER_1,
  seedDatabase as seedTestDatabase,
} from 'prisma/fixtures/seed-test';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { UsersService } from 'src/users/services/users.service';

export async function loginAndReturnAccessToken(
  app: INestApplication,
  username: string,
  password: string,
): Promise<string> {
  const loginDto = { username, password };

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send(loginDto)
    .expect(HTTP._201_CREATED);

  expect(loginResponse.body).toHaveProperty('accessToken');
  return loginResponse.body.accessToken;
}

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET,
        }),
      ],
      providers: [
        PrismaService,
        UsersService,
        JwtService,
        JwtStrategy,
        AuthService,
      ],
      controllers: [AuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await seedTestDatabase();
  });

  it('should successfully login', async () => {
    const accessToken: string = await loginAndReturnAccessToken(
      app,
      TEST_USER_1,
      TEST_PASSWORD,
    );

    expect(accessToken).toBeDefined();
    expect(accessToken).not.toBeNull();
    expect(accessToken).not.toEqual('');
  });

  it('should fail login with wrong username', async () => {
    const loginDto = {
      username: 'wrong_login',
      password: 'blabla',
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(HTTP._401_UNAUTHORIZED);
  });

  it('should fail login with wrong password', async () => {
    const loginDto = {
      username: TEST_USER_1,
      password: 'blabla',
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(HTTP._401_UNAUTHORIZED);
  });

  it('should successfully logout', async () => {
    const accessToken: string = await loginAndReturnAccessToken(
      app,
      TEST_USER_1,
      TEST_PASSWORD,
    );

    const response = await request(app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HTTP._200_OK);

    expect(response.body).toEqual({
      message: 'Logout successful for userId=1',
    });
  });
});
