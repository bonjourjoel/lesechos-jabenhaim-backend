import * as request from 'supertest';

import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  TEST_PASSWORD,
  TEST_USER_1,
  TEST_USER_ADMIN,
  seedTestDatabase,
} from 'prisma/fixtures/seed-test';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from 'src/auth/controllers/auth.controller';
import { AuthService } from 'src/auth/services/auth.service';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { UserType } from 'src/common/enums/user-type.enum';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { hashPassword } from 'src/common/utils/password-hasher.utils';
import { loginAndReturnAccessToken } from 'src/auth/controllers/auth.controller.spec';

describe('UsersController', () => {
  let app: INestApplication;
  let userAccessToken: string;
  let adminAccessToken: string;

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
      controllers: [AuthController, UsersController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await seedTestDatabase();

    // Connect as USER
    userAccessToken = await loginAndReturnAccessToken(
      app,
      TEST_USER_1,
      TEST_PASSWORD,
    );

    // Connect as ADMIN
    adminAccessToken = await loginAndReturnAccessToken(
      app,
      TEST_USER_ADMIN,
      TEST_PASSWORD,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET) - List users', () => {
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(HTTP._401_UNAUTHORIZED);
    });

    it('should return 403 for USER role trying to access user list', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._403_FORBIDDEN);
    });

    it('should allow ADMIN to list users with filters, sorting, and pagination', async () => {
      // Test with filter (by username), sorting by id, descending, and pagination (limit 1)
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          username: TEST_USER_1, // Filter by username
          sortBy: 'id', // Sort by ID
          sortDir: 'desc', // Descending order
          page: 1, // Page 1
          limit: 1, // Limit results to 1
        })
        .expect(HTTP._200_OK);

      // Verify the filter and pagination
      expect(response.body).toHaveLength(1); // Expect only one user due to limit=1
      expect(response.body[0].username).toEqual(TEST_USER_1); // Verify filter works
    });

    it('should allow ADMIN to paginate users correctly', async () => {
      // Test pagination on page 2 with limit 1 (should return second user)
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          page: 2, // Page 2
          limit: 1, // Limit results to 1
        })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveLength(1); // Expect only one user
      expect(response.body[0].username).toEqual(TEST_USER_ADMIN); // Should return the second user on page 2
    });
  });

  describe('/users/:id (GET) - Get user by ID', () => {
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .get('/users/1')
        .expect(HTTP._401_UNAUTHORIZED);
    });

    it('should return 403 for USER role trying to access another user', async () => {
      await request(app.getHttpServer())
        .get('/users/2')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._403_FORBIDDEN);
    });

    it('should allow USER to access their own user data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
    });

    it('should allow ADMIN to access any user data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
    });
  });

  describe('/users/:id (PUT) - Update user by ID', () => {
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .put('/users/1')
        .send({ name: 'Updated' })
        .expect(HTTP._401_UNAUTHORIZED);
    });

    it('should return 403 for USER role trying to update another user', async () => {
      await request(app.getHttpServer())
        .put('/users/2')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: 'Updated' })
        .expect(HTTP._403_FORBIDDEN);
    });

    it('should allow USER to update their own data', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: 'Updated Name' })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should allow ADMIN to update any user data', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Admin Updated' })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('name', 'Admin Updated');
    });

    it('should return 403 if USER tries to update userType to ADMIN', async () => {
      await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: UserType.ADMIN }) // USER trying to change userType to 'ADMIN'
        .expect(HTTP._403_FORBIDDEN);
    });

    it('should allow USER to update userType to USER or undefined', async () => {
      // Test userType set to 'USER'
      let response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: UserType.USER })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', UserType.USER);

      // Test userType set to undefined
      response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: undefined })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', UserType.USER); // Assuming 'USER' remains unchanged or default
    });

    it('should allow ADMIN to update userType to ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userType: UserType.ADMIN })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', UserType.ADMIN);
    });

    it('should allow ADMIN to update all fields of a user at once', async () => {
      const updatedData = {
        username: 'updatedUser',
        passwordHashed: await hashPassword('newpassword'),
        name: 'Updated Full Name',
        address: '789 New Address',
        comment: 'Updated comment by admin',
        userType: UserType.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('username', updatedData.username);
      expect(response.body).toHaveProperty('name', updatedData.name);
      expect(response.body).toHaveProperty('address', updatedData.address);
      expect(response.body).toHaveProperty('comment', updatedData.comment);
      expect(response.body).toHaveProperty('userType', updatedData.userType);
    });

    it('should update user data and reflect the changes on a subsequent GET request', async () => {
      const updatedData = {
        name: 'New Name After Update',
        address: 'New Address 123',
        comment: 'Updated comment',
      };

      // Perform the PUT request to update the user
      await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._200_OK);

      // Perform the GET request to verify the updated data
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      // Verify that the data has been updated
      expect(response.body).toHaveProperty('name', updatedData.name);
      expect(response.body).toHaveProperty('address', updatedData.address);
      expect(response.body).toHaveProperty('comment', updatedData.comment);
    });
  });

  describe('/users/:id (DELETE) - Delete user by ID', () => {
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .delete('/users/1')
        .expect(HTTP._401_UNAUTHORIZED);
    });

    it('should return 403 for USER role trying to delete another user', async () => {
      await request(app.getHttpServer())
        .delete('/users/2')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._403_FORBIDDEN);
    });

    it('should allow USER to delete their own data', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
    });

    it('should allow ADMIN to delete any user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 2);
    });
  });
});
