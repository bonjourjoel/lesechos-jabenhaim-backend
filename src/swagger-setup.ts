import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { INestApplication } from '@nestjs/common';

export function buildSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Les Echos - test dev back end - Joel Abenhaim')
    .setDescription("Documentation et test de l'API RESTful")
    .setVersion('1.0')
    // add sections
    .addTag('apidoc')
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
  return document;
}
