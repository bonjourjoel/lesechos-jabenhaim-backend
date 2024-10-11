import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersController } from './controllers/users.controller';
import { UsersDbService } from './services/users.db.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersDbService],
  controllers: [UsersController],
  exports: [UsersDbService],
})
export class UsersModule {}
