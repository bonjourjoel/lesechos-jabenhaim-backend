import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MultipartJsonMiddleware } from './common/middlewares/multipart-json.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/services/prisma.service';
import { UsersModule } from './users/users.module';
import { ApidocModule } from './apidoc/apidoc.module';

@Module({
  imports: [
    // source environment variables
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ApidocModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the MultipartJsonMiddleware globally to all routes
    consumer
      .apply(MultipartJsonMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
