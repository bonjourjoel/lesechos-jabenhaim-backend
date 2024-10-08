import * as request from 'supertest';

import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  TEST_PASSWORD,
  TEST_USER_1,
  seedDatabase as seedTestDatabase,
} from 'prisma/fixtures/seed-test';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

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

    // Seed test database before all tests
    await seedTestDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST)', async () => {
    const loginDto = {
      username: TEST_USER_1,
      password: TEST_PASSWORD,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(HTTP._201_CREATED);

    expect(response.body).toHaveProperty('accessToken');
  });

  it('/auth/logout (DELETE)', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD });

    const response = await request(app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(HTTP._200_OK);

    expect(response.body).toEqual({ message: 'Logout successful' });
  });
});
