import { Injectable, NotFoundException } from '@nestjs/common';

import { GetUsersQueryDto } from '../dtos/get-users-query.dto';
import { IUser } from '../types/user.type';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { User } from '@prisma/client';
import { UserType } from 'src/common/enums/user-type.enum';
import { hashPassword } from 'src/common/utils/password-hasher.utils';
import { prismaErrorMiddleware } from 'src/common/utils/prisma-error-handler.utils';

type UserWithoutPassword = Omit<User, 'passwordHashed'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Method to exclude passwordHashed field from a user
  private excludePassword(user: User): UserWithoutPassword {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHashed, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(userData: IUser): Promise<UserWithoutPassword> {
    const passwordHashed: string = await hashPassword(userData.password);
    const userTypeAsString: string = userData.userType.toString();
    delete userData.password;

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHashed,
        userType: userTypeAsString,
      },
    });

    return this.excludePassword(user);
  }

  async findUserById(id: number): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return this.excludePassword(user);
  }

  // caution: this method returns the user with the passwordHashed field. do not send back to the client
  async findUserByUsername(username: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return user;
  }

  async updateUser(
    id: number,
    userData: Partial<IUser>,
  ): Promise<UserWithoutPassword> {
    const passwordHashed: string = userData.password
      ? await hashPassword(userData.password)
      : undefined;
    const userTypeAsString: string = userData.userType?.toString();
    delete userData.password;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...userData,
          passwordHashed,
          userType: userTypeAsString,
        },
      });
      return this.excludePassword(user);
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async deleteUser(id: number): Promise<UserWithoutPassword> {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });
      return this.excludePassword(user);
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async findAllUsers_REMOVEME(
    userType?: UserType,
  ): Promise<UserWithoutPassword[]> {
    const users = await this.prisma.user.findMany({
      where: { userType },
    });

    return users.map(this.excludePassword);
  }

  async findAllUsers(query: GetUsersQueryDto): Promise<User[]> {
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
    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
    });
    return users;
  }
}
