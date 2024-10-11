import { Test, TestingModule } from '@nestjs/testing';

import { HtmlGeneratorService } from './html-generator.service';
import { OpenApiGeneratorService } from './openapi-generator.service';

describe('Unit Test: HtmlGeneratorService', () => {
  let service: HtmlGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenApiGeneratorService, HtmlGeneratorService],
    }).compile();

    service = module.get<HtmlGeneratorService>(HtmlGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
