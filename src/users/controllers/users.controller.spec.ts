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
import { CreateUserDto } from '../dtos/create-user.dto';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { UserType } from 'src/common/enums/user-type.enum';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { hashPassword } from 'src/common/utils/password-hasher.utils';

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
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);
    userAccessToken = loginResponse.body.accessToken;

    // Connect as ADMIN
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USER_ADMIN, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);
    adminAccessToken = adminResponse.body.accessToken;
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

    it('should allow ADMIN to list users filtered by username, sorted by id in descending order, and paginated', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          username: TEST_USER_1, // Filter by username 'testuser1'
          sortBy: 'id', // Sort by ID
          sortDir: 'desc', // Descending order
          page: 1, // Page 1
          limit: 1, // Limit results to 1
        })
        .expect(HTTP._200_OK);

      // Verify the filter and pagination
      expect(response.body).toHaveLength(1); // Expect only one user due to limit=1
      expect(response.body[0].username).toEqual(TEST_USER_1); // Should return 'testuser1'
      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
    });

    it('should allow ADMIN to paginate users and return correct users on each page', async () => {
      const page1Response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          page: 1, // Page 1
          limit: 1, // Limit results to 1 user per page
        })
        .expect(HTTP._200_OK);

      expect(page1Response.body).toHaveLength(1);
      const firstUserId = page1Response.body[0].id;
      expect(page1Response.body[0].username).toEqual(TEST_USER_1); // First user should be 'testuser1'

      const page2Response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          page: 2, // Page 2
          limit: 1, // Limit results to 1 user per page
        })
        .expect(HTTP._200_OK);

      expect(page2Response.body).toHaveLength(1);
      const secondUserId = page2Response.body[0].id;
      expect(secondUserId).not.toEqual(firstUserId); // Ensure the second page returns a different user
      expect(page2Response.body[0].username).toEqual(TEST_USER_ADMIN); // Second user should be 'adminuser'
      expect(page2Response.body[0]).not.toHaveProperty('passwordHashed');
      expect(page2Response.body[0]).not.toHaveProperty('refreshToken');
    });

    it('should sort users by id in ascending order and verify the sort works correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          sortBy: 'id',
          sortDir: 'asc', // Ascending order
        })
        .expect(HTTP._200_OK);

      expect(response.body.length).toBeGreaterThan(1);
      expect(response.body[0].id).toBeLessThan(response.body[1].id); // Verify ascending order
      expect(response.body[0].username).toEqual(TEST_USER_1); // First user should be 'testuser1'
      expect(response.body[1].username).toEqual(TEST_USER_ADMIN); // Second user should be 'adminuser'
      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
    });

    it('should filter users by userType and paginate the results', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          userType: UserType.USER, // Filter by userType USER
          sortBy: 'username', // Sort by username
          sortDir: 'desc', // Descending order
          page: 1, // First page
          limit: 2, // Limit results to 2 users per page
        })
        .expect(HTTP._200_OK);

      expect(response.body.length).toBeLessThanOrEqual(2); // Ensure pagination works

      if (response.body.length === 2) {
        expect(
          response.body[0].username.localeCompare(response.body[1].username),
        ).toBeGreaterThan(0); // Verify descending order for usernames
      }

      expect(
        response.body.every((user) => user.userType === UserType.USER),
      ).toBe(true); // Ensure filter by userType works (only USERs)
      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
    });

    it('should return an empty list if no users match the filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          username: 'nonexistentuser', // Filter by a non-existent username
        })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveLength(0); // Expect empty result
    });

    it('should return an empty list when paginating beyond the last page', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          page: 1000, // Arbitrary large page number
          limit: 1,
        })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveLength(0); // Expect empty result
    });

    it('should allow sorting by username in descending order and return correctly sorted users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          sortBy: 'username',
          sortDir: 'desc',
        })
        .expect(HTTP._200_OK);

      expect(response.body.length).toBeGreaterThan(1);

      if (response.body.length === 2) {
        expect(
          response.body[0].username.localeCompare(response.body[1].username),
        ).toBeGreaterThan(0); // Verify descending order for usernames
      }

      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
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
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should allow ADMIN to access any user data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });
  });

  describe('/users (POST) - Create a new user', () => {
    const newUser: CreateUserDto = {
      username: 'newuser',
      password: 'password123',
      name: 'New User',
      address: '123 New St',
      comment: 'This is a new user',
      userType: UserType.USER,
    };

    it('should return 400 if validation fails', async () => {
      // Send incomplete data to trigger validation failure
      const incompleteUserData = {
        username: 'incompleteuser',
        password: '', // Password is empty, validation should fail
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(incompleteUserData)
        .expect(HTTP._400_BAD_REQUEST);
    });

    it('should create a new user and return 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(HTTP._201_CREATED);

      // Verify the response contains the correct user details
      expect(response.body).toHaveProperty('username', newUser.username);
      expect(response.body).toHaveProperty('name', newUser.name);
      expect(response.body).toHaveProperty('address', newUser.address);
      expect(response.body).toHaveProperty('comment', newUser.comment);
      expect(response.body).toHaveProperty('userType', newUser.userType);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should create a user and reflect it in a subsequent GET request', async () => {
      // First, create the new user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(HTTP._201_CREATED);

      const createdUserId = createResponse.body.id;

      // Then, verify the user can be retrieved with GET
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      // Verify the data retrieved is the same as the one sent during creation
      expect(getResponse.body).toHaveProperty('id', createdUserId);
      expect(getResponse.body).toHaveProperty('username', newUser.username);
      expect(getResponse.body).toHaveProperty('name', newUser.name);
      expect(getResponse.body).toHaveProperty('address', newUser.address);
      expect(getResponse.body).toHaveProperty('comment', newUser.comment);
      expect(getResponse.body).toHaveProperty('userType', newUser.userType);
      expect(getResponse.body).not.toHaveProperty('passwordHashed');
      expect(getResponse.body).not.toHaveProperty('refreshToken');
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
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should allow ADMIN to update any user data', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Admin Updated' })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('name', 'Admin Updated');
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
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
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');

      // Test userType set to undefined
      response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: undefined })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', UserType.USER); // Assuming 'USER' remains unchanged or default
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should allow ADMIN to update userType to ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userType: UserType.ADMIN })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', UserType.ADMIN);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
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
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
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
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
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
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should allow ADMIN to delete any user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should delete a user and return 404 on subsequent GET request', async () => {
      // Perform the DELETE request to delete the user
      await request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      // Perform the GET request to verify the user no longer exists
      await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._404_NOT_FOUND);
    });
  });
});
