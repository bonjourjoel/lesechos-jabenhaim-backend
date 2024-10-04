import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { IUser } from './types/user.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { UserType } from 'src/common/enums/user-type.enum';
import { hashPassword } from 'src/common/utils/password-hasher.utils';
import { prismaErrorMiddleware } from 'src/common/utils/prisma-error-handler';

type UserWithoutPassword = Omit<User, 'passwordHashed'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Method to exclude passwordHashed field from a user
  private excludePassword(user: User): UserWithoutPassword {
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

  async findAllUsers(userType?: UserType): Promise<UserWithoutPassword[]> {
    const users = await this.prisma.user.findMany({
      where: { userType },
    });

    // Exclure passwordHashed de tous les utilisateurs
    return users.map(this.excludePassword);
  }
}
