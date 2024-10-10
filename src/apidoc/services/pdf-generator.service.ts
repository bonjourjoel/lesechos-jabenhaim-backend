import * as puppeteer from 'puppeteer';

import { Buffer } from 'buffer';
import { Injectable } from '@nestjs/common';
import { OpenApiGeneratorService } from './openapi-generator.service';

@Injectable()
export class PdfGeneratorService {
  constructor(
    private readonly openApiGeneratorService: OpenApiGeneratorService,
  ) {}

  async generatePdf(): Promise<Buffer> {
    // Generate Swagger document
    const swaggerDocument = this.openApiGeneratorService.generateOpenApiJson();

    // Launch Puppeteer to create the PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set up the HTML content based on the Swagger documentation
    await page.setContent(
      `
      <html>
        <head><title>API Documentation</title></head>
        <body>
          <h1>${swaggerDocument.info.title}</h1>
          <p>${swaggerDocument.info.description}</p>
          <pre>${JSON.stringify(swaggerDocument, null, 2)}</pre>
        </body>
      </html>
    `,
      { waitUntil: 'networkidle0' },
    );

    // Generate PDF as a Uint8Array
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    // Convert Uint8Array to Buffer for Node.js compatibility
    return Buffer.from(pdfBuffer);
  }
}
