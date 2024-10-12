import { AuthController } from './controllers/auth.controller';
import { AuthDbService } from './services/auth.db.service';
import { AuthService } from './services/auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from '../users/users.module';

/**
 * Authentification & Authorization module, using jwt (for the moment).
 * Provides endpoints to login, refresh jwt token, logout.
 */

@Module({
  imports: [
    // Make sure env variable JWT_SECRET is defined before initializing this module (doesn't work otherwise because AuthModule could be intialized first in AppModule)
    JwtModule.registerAsync({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `.env.${process.env.NODE_ENV}`,
          isGlobal: true,
        }),
      ],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),
    PrismaModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthDbService, AuthService, JwtStrategy],
})
export class AuthModule {}
