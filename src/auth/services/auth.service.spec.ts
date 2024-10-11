import { Test, TestingModule } from '@nestjs/testing';

import { AuthDbService } from './auth.db.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { UsersDbService } from 'src/users/services/users.db.service';

describe('Unit Test: AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        PrismaService,
        UsersDbService,
        AuthService,
        AuthDbService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
