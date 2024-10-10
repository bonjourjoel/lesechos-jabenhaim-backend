import { ApidocController } from './controllers/apidoc.controller';
import { HtmlGeneratorService } from './services/html-generator.service';
import { Module } from '@nestjs/common';
import { OpenApiGeneratorService } from './services/openapi-generator.service';
import { PdfGeneratorService } from './services/pdf-generator.service';

@Module({
  controllers: [ApidocController],
  providers: [
    OpenApiGeneratorService,
    PdfGeneratorService,
    HtmlGeneratorService,
  ],
})
export class ApidocModule {}
