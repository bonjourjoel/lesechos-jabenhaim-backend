import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // create nest.js app
  const app = await NestFactory.create(AppModule);

  // Configure default validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Ignores properties not specified in the DTO
      forbidNonWhitelisted: true, // Returns an error if unspecified properties are present
    }),
  );

  // Configure Swagger
  const SWAGGER_ENDPOINT_NAME = 'swagger';
  const config = new DocumentBuilder()
    .setTitle('Les Echos - test dev back end - Joel Abenhaim')
    .setDescription("Documentation et test de l'API RESTful")
    .setVersion('1.0')
    // add sections
    .addTag('root')
    .addTag('auth')
    .addTag('users')
    // add a bearer token button login/logout, the jwt token will be automatically added to each request
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Log in , then enter your JWT Bearer token (accessToken)',
    })
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_ENDPOINT_NAME, app, document);

  // start app
  await app.listen(process.env.HTTP_PORT);

  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log(`REST API running on http://localhost:${process.env.HTTP_PORT}`);
  console.log(
    `SwaggerUi at http://localhost:${process.env.HTTP_PORT}/${SWAGGER_ENDPOINT_NAME}`,
  );
}

void bootstrap();
