import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { OpenApiGeneratorService } from './apidoc/services/openapi-generator.service';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { buildSwaggerDocument } from './swagger-setup';

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
  const document = buildSwaggerDocument(app);
  SwaggerModule.setup(SWAGGER_ENDPOINT_NAME, app, document);

  // Initialize the services needing the app instance
  const openApiGeneratorService = app.get(OpenApiGeneratorService);
  openApiGeneratorService.initialize(app);

  // start app
  await app.listen(process.env.HTTP_PORT);

  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log(`REST API running on http://localhost:${process.env.HTTP_PORT}`);
  console.log(
    `SwaggerUi at http://localhost:${process.env.HTTP_PORT}/${SWAGGER_ENDPOINT_NAME}`,
  );
}

void bootstrap();
