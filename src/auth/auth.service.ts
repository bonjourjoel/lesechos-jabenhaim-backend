import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { comparePasswords } from 'src/common/utils/password-hasher.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user: User = await this.usersService.findUserByUsername(
      loginDto.username,
    );
    if (!user || !comparePasswords(loginDto.password, user.passwordHashed)) {
      throw new UnauthorizedException('Wrong login / password.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      userid: user.id,
      username: user.username,
      userType: user.userType,
    };
  }

  async logout(userId: number) {
    return { message: 'Logout successful' }; // must erase the jwt on the client
  }
}
