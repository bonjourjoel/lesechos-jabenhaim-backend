import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/prisma/services/prisma.service';
import { UsersDbService } from './users.db.service';

describe('Unit Test: UsersDbService', () => {
  let service: UsersDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, UsersDbService],
    }).compile();

    service = module.get<UsersDbService>(UsersDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
