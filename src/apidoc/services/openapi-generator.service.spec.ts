import { Test, TestingModule } from '@nestjs/testing';

import { OpenApiGeneratorService } from './openapi-generator.service';

describe('Unit Test: OpenapiGeneratorService', () => {
  let service: OpenApiGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenApiGeneratorService],
    }).compile();

    service = module.get<OpenApiGeneratorService>(OpenApiGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
