import { GetUsersQueryDto } from '../dtos/get-users-query.dto';
import { IUser } from '../types/user.type';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { User } from '@prisma/client';
import { hashPassword } from 'src/common/utils/password-hasher.utils';
import { hashToken } from 'src/common/utils/token-hasher.utils';
import { prismaErrorMiddleware } from 'src/common/utils/prisma-error-middleware.utils';

type UserWithoutPassword = Omit<User, 'passwordHashed'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // remove sensitive information both in types User and IUser
  private removeUserSensitiveInformation<T extends Partial<IUser> | User>(
    user: T,
  ): T {
    const sanitizedUser = { ...user };

    if ('password' in sanitizedUser) {
      delete sanitizedUser.password;
    }
    if ('passwordHashed' in sanitizedUser) {
      delete sanitizedUser.passwordHashed;
    }
    if ('refreshTokenHashed' in sanitizedUser) {
      delete sanitizedUser.refreshTokenHashed;
    }

    return sanitizedUser;
  }

  async createUser(userData: IUser): Promise<UserWithoutPassword> {
    const passwordHashed: string = await hashPassword(userData.password);
    const userTypeAsString: string = userData.userType.toString();

    try {
      const user = await this.prisma.user.create({
        data: {
          ...this.removeUserSensitiveInformation(userData),
          passwordHashed,
          userType: userTypeAsString,
        },
      });

      return this.removeUserSensitiveInformation(user);
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async findUserById(
    id: number,
    options?: { removeSensitiveInformation?: boolean /* default: true */ },
  ): Promise<UserWithoutPassword> {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id },
      });

      if (options?.removeSensitiveInformation === false) {
        return user;
      } else {
        return this.removeUserSensitiveInformation(user);
      }
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async findUserByUsername(
    username: string,
    options?: { removeSensitiveInformation?: boolean /* default: true */ },
  ): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      if (options?.removeSensitiveInformation === false) {
        return user;
      } else {
        return this.removeUserSensitiveInformation(user);
      }
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async updateUser(
    id: number,
    userData: Partial<IUser>,
  ): Promise<UserWithoutPassword> {
    const passwordHashed: string = userData.password
      ? await hashPassword(userData.password)
      : undefined;
    const userTypeAsString: string = userData.userType?.toString();

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...this.removeUserSensitiveInformation(userData),
          passwordHashed,
          userType: userTypeAsString,
        },
      });

      return this.removeUserSensitiveInformation(user);
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async deleteUser(id: number): Promise<UserWithoutPassword> {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });

      return this.removeUserSensitiveInformation(user);
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async findAllUsers(query: GetUsersQueryDto): Promise<UserWithoutPassword[]> {
    // compute filter
    const where: any = {};
    if (query.username) {
      where.username = query.username;
    }
    if (query.name) {
      where.name = query.name;
    }
    if (query.address) {
      where.address = query.address;
    }
    if (query.comment) {
      where.comment = query.comment;
    }
    if (query.userType) {
      where.userType = query.userType;
    }

    // compute sort
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDir || 'asc' }
      : undefined;

    // compute pagination
    const take = query.limit || 100;
    const skip = query.page ? (query.page - 1) * take : undefined;

    // execute query
    try {
      const users = await this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
      });

      return users.map((user) => this.removeUserSensitiveInformation(user));
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const refreshTokenHashed: string = await hashToken(refreshToken);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHashed },
      });
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async removeRefreshToken(userId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHashed: null }, // Invalidate the Refresh Token by setting it to null
      });
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }
}
