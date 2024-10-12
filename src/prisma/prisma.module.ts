import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';

/**
 * Provides an injectable Prisma client
 */

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
