import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { APP_GUARD } from '@nestjs/core';
import { ApidocModule } from 'src/apidoc/apidoc.module';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MultipartJsonMiddleware } from './middlewares/multipart-json.middleware';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { SanitizeMiddleware } from './middlewares/sanitize.middleware';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    // source environment variables
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    // install throttle
    ThrottlerModule.forRoot([
      {
        ttl: 10 * 1000, // interval 10 seconds
        limit: 10, // max requests per interval per ip address
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    ApidocModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // install throttle globally
    {
      provide: APP_GUARD, // Provide ThrottlerGuard as a global guard
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MultipartJsonMiddleware, SanitizeMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
