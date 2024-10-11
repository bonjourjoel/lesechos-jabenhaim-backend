import { Test, TestingModule } from '@nestjs/testing';

import { OpenApiGeneratorService } from './openapi-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';

describe('Unit Test: PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenApiGeneratorService, PdfGeneratorService],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
