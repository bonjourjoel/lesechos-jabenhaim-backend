import * as request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';

import { ApidocController } from './apidoc.controller';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { HtmlGeneratorService } from 'src/apidoc/services/html-generator.service';
import { INestApplication } from '@nestjs/common';
import { OpenApiGeneratorService } from 'src/apidoc/services/openapi-generator.service';
import { PdfGeneratorService } from 'src/apidoc/services/pdf-generator.service';

describe('ApidocController', () => {
  let app: INestApplication;
  let openApiGeneratorService: OpenApiGeneratorService;

  beforeAll(async () => {
    // Setup the testing module with the full AppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ApidocController],
      providers: [
        OpenApiGeneratorService,
        PdfGeneratorService,
        HtmlGeneratorService,
      ],
    }).compile();

    // Initialize the app and the service
    app = moduleFixture.createNestApplication();
    await app.init();

    // Retrieve the services from the app context
    openApiGeneratorService = app.get<OpenApiGeneratorService>(
      OpenApiGeneratorService,
    );

    // Initialize services if needed
    openApiGeneratorService.initialize(app);
  });

  afterAll(async () => {
    // Gracefully close the app after the tests
    await app.close();
  });

  // Test for PDF format
  it('/apidoc/generate (GET) should generate a PDF', async () => {
    const response = await request(app.getHttpServer())
      .get('/apidoc/generate?format=PDF')
      .expect(HTTP._200_OK);

    // Check that the content type is 'application/pdf'
    expect(response.headers['content-type']).toBe('application/pdf');

    // Verify that the PDF buffer is not empty
    expect(response.body.length).toBeGreaterThan(1000); // Ensure there's content in the PDF
  });

  // Test for JSON format
  it('/apidoc/generate (GET) should generate OpenAPI JSON', async () => {
    const response = await request(app.getHttpServer())
      .get('/apidoc/generate?format=JSON')
      .expect(HTTP._200_OK);

    // Check that the content type is 'application/json'
    expect(response.headers['content-type']).toContain('application/json');

    // Verify that the response body is a valid OpenAPI JSON object
    expect(response.body).toHaveProperty('openapi'); // Check for 'openapi' property
    expect(response.body).toHaveProperty('info'); // Check for 'info' section
    expect(response.body).toHaveProperty('paths'); // Check for 'paths' section
  });

  // Test for HTML format
  it('/apidoc/generate (GET) should generate OpenAPI HTML', async () => {
    const response = await request(app.getHttpServer())
      .get('/apidoc/generate?format=HTML')
      .expect(HTTP._200_OK);

    // Check that the content type is 'text/html'
    expect(response.headers['content-type']).toContain('text/html');

    // Check that the response body contains valid HTML
    expect(response.text).toContain('<html>'); // Basic check for HTML structure
    expect(response.text).toContain('API Documentation'); // Check for title or any known text in the HTML
  });

  // Test for invalid format
  it('/apidoc/generate (GET) should return 400 for an invalid format', async () => {
    await request(app.getHttpServer())
      .get('/apidoc/generate?format=invalid-format')
      .expect(HTTP._400_BAD_REQUEST); // Expecting a 400 Bad Request
  });
});
