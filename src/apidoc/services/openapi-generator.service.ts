import { INestApplication } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { buildSwaggerDocument } from 'src/app/utils/swagger-setup.util';

@Injectable()
export class OpenApiGeneratorService {
  private app: INestApplication;

  initialize(app: INestApplication) {
    this.app = app;
  }

  // Method to generate the OpenAPI JSON
  generateOpenApiJson() {
    // Ensure that the app instance is available
    if (!this.app) {
      throw new Error('Application instance is not initialized');
    }

    // Generate Swagger document
    const swaggerDocument = buildSwaggerDocument(this.app);

    // Return the generated OpenAPI document (JSON format)
    return swaggerDocument;
  }
}
