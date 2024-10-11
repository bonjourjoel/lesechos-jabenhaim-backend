import * as request from 'supertest';

import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  TEST_PASSWORD,
  TEST_USERNAME_1,
  seedTestDatabase,
} from 'prisma/fixtures/seed-test';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthDbService } from '../services/auth.db.service';
import { AuthService } from '../services/auth.service';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { UsersDbService } from 'src/users/services/users.db.service';

/**
 * =======================================================
 * Test suite: AuthController
 * =======================================================
 */
describe('Integration Test: AuthController', () => {
  let app: INestApplication;
  let usersDbService: UsersDbService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET,
        }),
      ],
      providers: [
        PrismaService,
        UsersDbService,
        JwtService,
        JwtStrategy,
        AuthDbService,
        AuthService,
      ],
      controllers: [AuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersDbService = moduleFixture.get<UsersDbService>(UsersDbService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await seedTestDatabase();
  });

  /**
   * =======================================================
   * Test suite: Login
   * =======================================================
   */
  describe('/auth/login - Log in', () => {
    // Test: Should return 400 if only username is provided (missing required fields like password)
    it('should return 400 if only username is provided', async () => {
      const incompleteData = {
        username: TEST_USERNAME_1,
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(incompleteData)
        .expect(HTTP._400_BAD_REQUEST); // Expecting validation to fail with 400
    });

    // Test: Should return 400 if username, password, and an unknown field are provided
    it('should return 400 if username, password, and an unknown field are provided', async () => {
      const invalidData = {
        username: TEST_USERNAME_1,
        password: TEST_PASSWORD,
        unknownField: 'someValue', // This field does not exist in the DTO
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidData)
        .expect(HTTP._400_BAD_REQUEST); // Expecting validation to fail with 400
    });

    // Test: Should successfully login
    it('should successfully login', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);
      const accessToken: string = loginResponse.body.accessToken;

      expect(accessToken).toBeDefined();
      expect(accessToken).not.toBeNull();
      expect(accessToken).not.toEqual('');
    });

    // Test: Should fail login with wrong username
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

    // Test: should fail login with wrong password
    it('should fail login with wrong password', async () => {
      const loginDto = {
        username: TEST_USERNAME_1,
        password: 'blabla',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(HTTP._401_UNAUTHORIZED);
    });
  });

  /**
   * =======================================================
   * Test suite: Refresh token
   * =======================================================
   */
  describe('/auth/refresh - Refresh token', () => {
    // Test: Should refresh the access token using refresh token
    it('should refresh the access token using refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);

      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HTTP._200_OK);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
    });

    // Test: Should refresh the access token twice and allow logout with the latest accessToken
    it('should refresh the access token twice and allow logout with the latest accessToken', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
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

    // Test: Should not allow refresh with the same refresh token after logout
    it('should not allow refresh with the same refresh token after logout', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
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

    // Test: Should not allow refresh with the old refresh token after a successful refresh
    it('should not allow refresh with the old refresh token after a successful refresh', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
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

  /**
   * =======================================================
   * Test suite: Log out
   * =======================================================
   */
  describe('/auth/logout - Log out', () => {
    // Test : Should successfully logout and remove the refresh token
    it('should successfully logout and remove the refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);

      const accessToken = loginResponse.body.accessToken;

      await request(app.getHttpServer())
        .delete('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HTTP._200_OK);

      const user = await usersDbService.findUserByUsername(TEST_USERNAME_1, {
        removeSensitiveInformation: false,
      });
      expect(user.refreshTokenHashed).toBeNull();
    });
  });
});
