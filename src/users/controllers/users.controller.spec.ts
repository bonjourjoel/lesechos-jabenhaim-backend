import * as request from 'supertest';

import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  TEST_PASSWORD,
  TEST_USERNAME_1,
  TEST_USERNAME_ADMIN,
  seedTestDatabase,
} from 'prisma/fixtures/seed-test';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from 'src/auth/controllers/auth.controller';
import { AuthDbService } from 'src/auth/services/auth.db.service';
import { AuthService } from 'src/auth/services/auth.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { INestApplication } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { USER_TYPE } from 'src/common/enums/user-type.enum';
import { UsersController } from './users.controller';
import { UsersDbService } from '../services/users.db.service';

/**
 * =======================================================
 * Test suite: UsersController
 * =======================================================
 */
describe('Integration Test: UsersController', () => {
  let app: INestApplication;
  let userAccessToken: string;
  let adminAccessToken: string;
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
      controllers: [AuthController, UsersController],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersDbService = app.get(UsersDbService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await seedTestDatabase();

    // Connect as USER
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USERNAME_1, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);
    userAccessToken = loginResponse.body.accessToken;

    // Connect as ADMIN
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: TEST_USERNAME_ADMIN, password: TEST_PASSWORD })
      .expect(HTTP._200_OK);
    adminAccessToken = adminResponse.body.accessToken;
  });

  /**
   * =======================================================
   * Test suite: GET
   * =======================================================
   */
  describe('/users (GET) - List users', () => {
    // Test: Should return 401 for unauthenticated users
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(HTTP._401_UNAUTHORIZED);
    });

    // Test: Should return 403 for USER role trying to access user list
    it('should return 403 for USER role trying to access user list', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._403_FORBIDDEN);
    });

    // Test: Should allow ADMIN to list users filtered by username, sorted by id in descending order, and paginated
    it('should allow ADMIN to list users filtered by username, sorted by id in descending order, and paginated', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          username: TEST_USERNAME_1, // Filter by username 'testuser1'
          sortBy: 'id', // Sort by ID
          sortDir: 'desc', // Descending order
          page: 1, // Page 1
          limit: 1, // Limit results to 1
        })
        .expect(HTTP._200_OK);

      // Verify the filter and pagination
      expect(response.body).toHaveLength(1); // Expect only one user due to limit=1
      expect(response.body[0].username).toEqual(TEST_USERNAME_1); // Should return 'testuser1'
      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
    });

    // Test: Should allow ADMIN to paginate users and return correct users on each page
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
      expect(page1Response.body[0].username).toEqual(TEST_USERNAME_1); // First user should be 'testuser1'

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
      expect(page2Response.body[0].username).toEqual(TEST_USERNAME_ADMIN); // Second user should be 'adminuser'
      expect(page2Response.body[0]).not.toHaveProperty('passwordHashed');
      expect(page2Response.body[0]).not.toHaveProperty('refreshToken');
    });

    // Test: Should sort users by id in ascending order and verify the sort works correctly
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
      expect(response.body[0].username).toEqual(TEST_USERNAME_1); // First user should be 'testuser1'
      expect(response.body[1].username).toEqual(TEST_USERNAME_ADMIN); // Second user should be 'adminuser'
      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
    });

    // Test: Should filter users by userType and paginate the results
    it('should filter users by userType and paginate the results', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          userType: USER_TYPE.USER, // Filter by userType USER
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
        response.body.every((user) => user.userType === USER_TYPE.USER),
      ).toBe(true); // Ensure filter by userType works (only USERs)
      expect(response.body[0]).not.toHaveProperty('passwordHashed');
      expect(response.body[0]).not.toHaveProperty('refreshToken');
    });

    // Test: Should return an empty list if no users match the filter
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

    // Test: Should return an empty list when paginating beyond the last page
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

    // Test: Should allow sorting by username in descending order and return correctly sorted users
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

    // Test with invalid token
    // Test: Should return 401 for GET /users with an invalid access token
    it('should return 401 for GET /users with an invalid access token', async () => {
      const invalidToken = 'invalid.jwt.token';

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HTTP._401_UNAUTHORIZED); // Expect 401 for invalid token
    });

    // Test with valid token after refresh
    // Test: Should allow GET /users after refreshing access token
    it('should allow GET /users after refreshing access token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_ADMIN, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);

      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HTTP._200_OK);

      const newAccessToken = refreshResponse.body.accessToken;

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(HTTP._200_OK); // Expect 200 after successful refresh
    });
  });

  /**
   * =======================================================
   * Test suite: GET:id
   * =======================================================
   */
  describe('/users/:id (GET) - Get user by ID', () => {
    // Test: Should return 401 for unauthenticated users
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .get('/users/1')
        .expect(HTTP._401_UNAUTHORIZED);
    });

    // Test: Should return 403 for USER role trying to access another user
    it('should return 403 for USER role trying to access another user', async () => {
      await request(app.getHttpServer())
        .get('/users/2')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._403_FORBIDDEN);
    });

    // Test: Should return 404 for non-existent user ID
    it('should return 404 for non-existent user ID', async () => {
      await request(app.getHttpServer())
        .get('/users/3')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._404_NOT_FOUND); // Expecting a 404 Not Found for non-existent user
    });

    // Test: Should allow USER to access their own user data
    it('should allow USER to access their own user data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should allow ADMIN to access any user data
    it('should allow ADMIN to access any user data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test with invalid token
    it('should return 401 for GET /users/:id with an invalid access token', async () => {
      const invalidToken = 'invalid.jwt.token';

      await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HTTP._401_UNAUTHORIZED); // Expect 401 for invalid token
    });

    // Test with valid token after refresh
    it('should allow GET /users/:id after refreshing access token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_ADMIN, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);

      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HTTP._200_OK);

      const newAccessToken = refreshResponse.body.accessToken;

      await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(HTTP._200_OK); // Expect 200 after successful refresh
    });
  });

  /**
   * =======================================================
   * Test suite: POST
   * =======================================================
   */
  describe('/users (POST) - Create a new user', () => {
    const newUser: CreateUserDto = {
      username: 'newuser',
      password: 'password123',
      name: 'New User',
      address: '123 New St',
      comment: 'This is a new user',
      userType: USER_TYPE.USER,
    };

    // Test: Should return 400 if validation fails
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

    // Test: Should return 500 when trying to create a user with an existing username
    it('should return 500 when trying to create a user with an existing username', async () => {
      const existingUserData = {
        username: TEST_USERNAME_1, // Username already exists
        password: 'newpassword',
        name: 'Duplicate User',
        address: '789 Another St',
        comment: 'Trying to create a duplicate user',
        userType: USER_TYPE.USER,
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(existingUserData)
        .expect(HTTP._500_INTERNAL_SERVER_ERROR); // Expecting a 500 Internal Server Error due to unique constraint violation
    });

    // Test: Should create a new user and return 201
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

    // Test: Should create a user and reflect it in a subsequent GET request
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

    // Test: Should return 400 when attempting to create a user with a non-existent field
    it('should return 400 when attempting to create a user with a non-existent field', async () => {
      const invalidCreateData = {
        username: 'newuser',
        password: 'password123',
        nonExistentField: 'This field does not exist', // Invalid field
      };

      // Make the POST request with invalid field
      await request(app.getHttpServer())
        .post('/users')
        .send(invalidCreateData)
        .expect(HTTP._400_BAD_REQUEST); // Expect 400 error due to non-existent field
    });
  });

  /**
   * =======================================================
   * Test suite: PATCH
   * =======================================================
   */
  describe('/users/:id (PATCH) - Update user by ID', () => {
    // Test: Should return 401 for unauthenticated users
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .patch('/users/1')
        .send({ name: 'Updated' })
        .expect(HTTP._401_UNAUTHORIZED);
    });

    // Test: Should return 403 for USER role trying to update another user
    it('should return 403 for USER role trying to update another user', async () => {
      await request(app.getHttpServer())
        .patch('/users/2')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: 'Updated' })
        .expect(HTTP._403_FORBIDDEN);
    });

    // Test: Should return 404 when trying to update a non-existent user
    it('should return 404 when trying to update a non-existent user', async () => {
      const updatedData = {
        name: 'Non-existent User',
        address: '123 Nowhere St',
      };

      await request(app.getHttpServer())
        .patch('/users/999') // Attempt to update a non-existent user with ID 999
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._404_NOT_FOUND); // Expecting a 404 Not Found as the user doesn't exist
    });

    // Test: Should return 500 when trying to update a user with an existing username
    it('should return 500 when trying to update a user with an existing username', async () => {
      const updatedData = {
        username: TEST_USERNAME_ADMIN, // Username already exists in another user
        name: 'Updated User',
        address: '789 New St',
      };

      await request(app.getHttpServer())
        .patch('/users/1') // Attempt to update user with ID 1
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._500_INTERNAL_SERVER_ERROR); // Expecting a 500 Internal Server Error due to unique constraint violation
    });

    // Test: Should allow USER to update their own data
    it('should allow USER to update their own data', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: 'Updated Name' })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should allow ADMIN to update any user data
    it('should allow ADMIN to update any user data', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Admin Updated' })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('name', 'Admin Updated');
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should return 403 if USER tries to update userType to ADMIN
    it('should return 403 if USER tries to update userType to ADMIN', async () => {
      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: USER_TYPE.ADMIN }) // USER trying to change userType to 'ADMIN'
        .expect(HTTP._403_FORBIDDEN);
    });

    // Test: Should allow USER to update userType to USER or undefined
    it('should allow USER to update userType to USER or undefined', async () => {
      // Test userType set to 'USER'
      let response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: USER_TYPE.USER })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', USER_TYPE.USER);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');

      // Test userType set to undefined
      response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userType: undefined })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', USER_TYPE.USER); // Assuming 'USER' remains unchanged or default
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should allow ADMIN to update userType to ADMIN
    it('should allow ADMIN to update userType to ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ userType: USER_TYPE.ADMIN })
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('userType', USER_TYPE.ADMIN);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should allow ADMIN to update all fields of a user at once
    it('should allow ADMIN to update all fields of a user at once', async () => {
      const updatedData = {
        username: 'updatedUser',
        name: 'Updated Full Name',
        address: '789 New Address',
        comment: 'Updated comment by admin',
        userType: USER_TYPE.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .patch('/users/1')
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

    // Test: Should update user data and reflect the changes on a subsequent GET request
    it('should update user data and reflect the changes on a subsequent GET request', async () => {
      const updatedData = {
        name: 'New Name After Update',
        address: 'New Address 123',
        comment: 'Updated comment',
      };

      // Perform the PUT request to update the user
      await request(app.getHttpServer())
        .patch('/users/1')
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

    // Test: Keep a field unchanged if undefined is passed and update other fields with provided values
    it('should keep a field unchanged if undefined is passed, and update other fields with provided values', async () => {
      const originalUser = await usersDbService.findUserById(1);

      const updatedData = {
        name: undefined, // Name should remain unchanged
        address: 'Updated Address',
      };

      const response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('name', originalUser.name); // Name should remain unchanged
      expect(response.body).toHaveProperty('address', updatedData.address); // Address should be updated
    });

    // Test: Set a field to null if null is passed
    it('should set a field to null if null is passed', async () => {
      const updatedData = {
        comment: null, // Comment should be set to null
      };

      const response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('comment', null); // Comment should now be null
    });

    // Test: Ensure sensitive fields are not modifiable
    it('should not allow modifying sensitive fields such as passwordHashed or refreshTokenHashed', async () => {
      const updatedData = {
        passwordHashed: 'newhashedpassword',
        refreshTokenHashed: 'newrefreshtoken',
      };

      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._400_BAD_REQUEST);
    });

    // Test: Validate that fields follow required validation rules
    it('should return 400 if validation rules for fields are not met', async () => {
      const invalidData = {
        username: ' ', // Bad username
        address: 'Valid address',
      };

      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invalidData)
        .expect(HTTP._400_BAD_REQUEST); // Should return validation error
    });

    // Test: Should not modify fields that are not included in the update request
    it('should not modify fields that are not included in the update request', async () => {
      const originalUser = await usersDbService.findUserById(1);

      const updatedData = {
        address: 'Updated Address',
      };

      const response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._200_OK);

      // Verify that only the 'address' is updated
      expect(response.body).toHaveProperty('address', updatedData.address);
      expect(response.body).toHaveProperty('name', originalUser.name); // Name remains unchanged
    });

    // Test: Should not allow updating non-modifiable fields such as id
    it('should not allow updating non-modifiable fields such as id', async () => {
      // Load the original user from the database
      const updatedData = {
        id: 999, // Attempting to modify the ID, which should not be allowed
        address: 'Updated Address', // Modifiable field
      };

      // Perform the update request
      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._400_BAD_REQUEST); // Validation ERROR
    });

    // Test: Should not allow updating non-modifiable fields such as passwordHashed, and refreshTokenHashed
    it('should not allow updating non-modifiable fields such as passwordHashed, and refreshTokenHashed', async () => {
      const updatedData = {
        passwordHashed: 'newhashedpassword', // Attempting to modify passwordHashed, which should not be allowed
        refreshTokenHashed: 'abcd', // Attempting to modify refreshTokenHashed, which should not be allowed
      };

      // Perform the update request
      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData)
        .expect(HTTP._400_BAD_REQUEST); // Validation ERROR
    });

    // Test with invalid token
    it('should return 401 for PUT /users/:id with an invalid access token', async () => {
      const invalidToken = 'invalid.jwt.token';
      const updatedData = {
        name: 'New Name',
        address: 'Updated Address',
      };

      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(updatedData)
        .expect(HTTP._401_UNAUTHORIZED); // Expect 401 for invalid token
    });

    // Test with valid token after refresh
    it('should allow PUT /users/:id after refreshing access token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_ADMIN, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);

      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HTTP._200_OK);

      const newAccessToken = refreshResponse.body.accessToken;

      const updatedData = {
        name: 'Updated Name',
        address: 'Updated Address',
      };

      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send(updatedData)
        .expect(HTTP._200_OK); // Expect 200 after successful refresh
    });

    // Test: Should return 400 when attempting to update a non-existent field
    it('should return 400 when attempting to update a non-existent field', async () => {
      const invalidUpdateData = {
        nonExistentField: 'This field does not exist', // Attempt to update an invalid field
        address: 'New Address', // Valid field for comparison
      };

      // Make the PUT request with invalid field
      await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invalidUpdateData)
        .expect(HTTP._400_BAD_REQUEST); // Expect 400 error due to non-existent field
    });
  });

  /**
   * =======================================================
   * Test suite: DELETE
   * =======================================================
   */
  describe('/users/:id (DELETE) - Delete user by ID', () => {
    // Test: Should return 401 for unauthenticated users
    it('should return 401 for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .delete('/users/1')
        .expect(HTTP._401_UNAUTHORIZED);
    });

    // Test: Should return 403 for USER role trying to delete another user
    it('should return 403 for USER role trying to delete another user', async () => {
      await request(app.getHttpServer())
        .delete('/users/2')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._403_FORBIDDEN);
    });

    // Test: Should return 404 when trying to delete a non-existent user
    it('should return 404 when trying to delete a non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/999') // Attempt to delete a non-existent user with ID 999
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._404_NOT_FOUND); // Expecting a 404 Not Found as the user doesn't exist
    });

    // Test: Should allow USER to delete their own data
    it('should allow USER to delete their own data', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should allow ADMIN to delete any user
    it('should allow ADMIN to delete any user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HTTP._200_OK);

      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).not.toHaveProperty('passwordHashed');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    // Test: Should delete a user and return 404 on subsequent GET request
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

    // Test with invalid token
    it('should return 401 for DELETE /users/:id with an invalid access token', async () => {
      const invalidToken = 'invalid.jwt.token';

      await request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HTTP._401_UNAUTHORIZED); // Expect 401 for invalid token
    });

    // Test with valid token after refresh
    it('should allow DELETE /users/:id after refreshing access token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USERNAME_ADMIN, password: TEST_PASSWORD })
        .expect(HTTP._200_OK);

      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HTTP._200_OK);

      const newAccessToken = refreshResponse.body.accessToken;

      await request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(HTTP._200_OK); // Expect 200 after successful refresh
    });
  });
});
