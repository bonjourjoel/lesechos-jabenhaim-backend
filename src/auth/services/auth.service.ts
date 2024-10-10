import {
  AUTH_ACCESS_TOKEN_EXPIRATION,
  AUTH_REFRESH_TOKEN_EXPIRATION,
} from '../consts/auth.const';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/services/users.service';
import { compareHashedPasword } from 'src/common/utils/password-hasher.utils';
import { compareHashedToken } from 'src/common/utils/token-hasher.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user: User = await this.usersService.findUserByUsername(
      loginDto.username,
      { removeSensitiveInformation: false },
    );
    if (
      !user ||
      !(await compareHashedPasword({
        plainStr: loginDto.password,
        hashedStr: user.passwordHashed,
      }))
    ) {
      throw new UnauthorizedException('Wrong login / password.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      nonce: `${Date.now()}-${Math.random()}`,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: AUTH_ACCESS_TOKEN_EXPIRATION, // Access Token short expiration
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET, // Different secret for Refresh Token
      expiresIn: AUTH_REFRESH_TOKEN_EXPIRATION, // Refresh Token long expiration
    });

    // Store the Refresh Token in the database (hashed)
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        username: user.username,
        userType: user.userType,
      },
    };
  }

  async refreshToken(userId: number, refreshToken: string) {
    const user = await this.usersService.findUserById(userId, {
      removeSensitiveInformation: false,
    });

    if (
      !user ||
      !(await compareHashedToken({
        plainStr: refreshToken,
        hashedStr: user.refreshTokenHashed,
      }))
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      nonce: `${Date.now()}-${Math.random()}`,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: AUTH_ACCESS_TOKEN_EXPIRATION,
    });

    const newRefreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: AUTH_REFRESH_TOKEN_EXPIRATION,
    });

    await this.usersService.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        userId: user.id,
        username: user.username,
        userType: user.userType,
      },
    };
  }

  async logout(userId: number) {
    await this.usersService.removeRefreshToken(userId);

    return { message: `Logout successful for userId=${userId}` };
  }
}
