import { API_VERSION } from './consts/app-const';
import { AllExceptionsLoggerFilter } from 'src/logger/filters/log-all-exceptions.filter';
import { AppModule } from './app.module';
import { Logger } from 'winston';
import { NestFactory } from '@nestjs/core';
import { OpenApiGeneratorService } from '../apidoc/services/openapi-generator.service';
import { SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { buildSwaggerDocument } from './utils/swagger-setup.util';
import helmet from 'helmet';

/**
 * Application entry point
 */

export async function bootstrap() {
  // Create nest.js app
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all API routes
  app.setGlobalPrefix(`api/${API_VERSION}`);

  // Initialize the Logger middleware error filter globally
  app.useGlobalFilters(app.get(AllExceptionsLoggerFilter));

  // Test the logger
  const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  logger.info('Logger initialzed');

  // Use Helmet middleware globally to add HTTP headers for security
  app.use(helmet());

  // Configure Swagger
  const SWAGGER_ENDPOINT_NAME = 'swagger';
  const document = buildSwaggerDocument(app);
  SwaggerModule.setup(SWAGGER_ENDPOINT_NAME, app, document);

  // Initialize the services needing the app instance
  const openApiGeneratorService = app.get(OpenApiGeneratorService);
  openApiGeneratorService.initialize(app);

  // Start app
  await app.listen(process.env.HTTP_PORT);

  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log(`REST API running on http://localhost:${process.env.HTTP_PORT}`);
  console.log(
    `SwaggerUi at http://localhost:${process.env.HTTP_PORT}/${SWAGGER_ENDPOINT_NAME}`,
  );
}
