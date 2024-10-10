import { Injectable } from '@nestjs/common';
import { OpenApiGeneratorService } from './openapi-generator.service';
import { exec } from 'child_process';
import { promisify } from 'util';

@Injectable()
export class HtmlGeneratorService {
  private readonly execAsync = promisify(exec);
  constructor(
    private readonly openApiGeneratorService: OpenApiGeneratorService,
  ) {}

  // Generate HTML from OpenAPI JSON using Redoc CLI
  async generateHtml(): Promise<string> {
    // Generate Swagger document
    const swaggerDocument = this.openApiGeneratorService.generateOpenApiJson();

    // Inline Redoc HTML template
    const openApiJson: string = JSON.stringify(swaggerDocument);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Documentation</title>
          <!-- Redoc script for rendering OpenAPI JSON as HTML -->
          <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        </head>
        <body>
          <redoc spec="${encodeURIComponent(openApiJson)}"></redoc>
          <script>
            Redoc.init(${openApiJson});
          </script>
        </body>
      </html>
    `;

    // Return the HTML content
    return htmlContent;
  }
}
