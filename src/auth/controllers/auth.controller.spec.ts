import * as request from 'supertest';

import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  TEST_PASSWORD,
  TEST_USER_1,
  seedTestDatabase,
} from 'prisma/fixtures/seed-test';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { UsersService } from 'src/users/services/users.service';

describe('AuthController', () => {
  let app: INestApplication;
  let usersService: UsersService;

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
    usersService = moduleFixture.get<UsersService>(UsersService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await seedTestDatabase();
  });

  it('should successfully login', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);
    const accessToken: string = loginResponse.body.accessToken;

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

  it('should refresh the access token using refresh token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);

    const refreshToken = loginResponse.body.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(HTTP._200_OK);

    expect(refreshResponse.body).toHaveProperty('accessToken');
    expect(refreshResponse.body).toHaveProperty('refreshToken');
  });

  it('should successfully logout and remove the refresh token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);

    const accessToken = loginResponse.body.accessToken;

    await request(app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HTTP._200_OK);

    const user = await usersService.findUserByUsername(TEST_USER_1, {
      removeSensitiveInformation: false,
    });
    expect(user.refreshTokenHashed).toBeNull();
  });

  it('should refresh the access token twice and allow logout with the latest accessToken', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);

    let refreshToken = loginResponse.body.refreshToken;

    const firstRefreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(HTTP._200_OK);

    refreshToken = firstRefreshResponse.body.refreshToken;

    const secondRefreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(HTTP._200_OK);

    const latestAccessToken = secondRefreshResponse.body.accessToken;

    await request(app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${latestAccessToken}`)
      .expect(HTTP._200_OK);
  });

  it('should not allow refresh with the same refresh token after logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);

    const refreshToken = loginResponse.body.refreshToken;

    await request(app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(HTTP._200_OK);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(HTTP._401_UNAUTHORIZED);
  });

  it('should not allow refresh with the old refresh token after a successful refresh', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);

    const refreshToken = loginResponse.body.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(HTTP._200_OK);

    const newRefreshToken = refreshResponse.body.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(HTTP._401_UNAUTHORIZED);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: newRefreshToken })
      .expect(HTTP._200_OK);
  });
});
