import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersController } from './controllers/users.controller';
import { UsersDbService } from './services/users.db.service';

/**
 * User Management Module
 *
 * This module provides the following functionalities for managing users:
 *
 * 1. **User Data**:
 *    - Each user has the following fields:
 *      - pseudonym (unique),
 *      - password (secured),
 *      - optional name (string),
 *      - optional postal address (free-form structure),
 *      - optional comment (string),
 *      - user type: either `admin` (full rights) or `user` (profile-limited).
 *
 * 2. **User Operations**:
 *    - Users can retrieve and modify their own profile information.
 *    - Admin users can modify and delete information of other users.
 *
 * 3. **User List**:
 *    - Available only to admin users, with sorting and filtering options on all fields.
 *
 * Endpoint: `/users`
 */

@Module({
  imports: [PrismaModule],
  providers: [UsersDbService],
  controllers: [UsersController],
  exports: [UsersDbService],
})
export class UsersModule {}
