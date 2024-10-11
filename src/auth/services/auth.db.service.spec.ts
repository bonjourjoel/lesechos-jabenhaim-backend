import { Test, TestingModule } from '@nestjs/testing';

import { AuthDbService } from './auth.db.service';
import { PrismaService } from 'src/prisma/services/prisma.service';

describe('AuthDbService', () => {
  let service: AuthDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuthDbService],
    }).compile();

    service = module.get<AuthDbService>(AuthDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
