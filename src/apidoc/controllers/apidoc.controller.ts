import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  OpenAPIObject,
} from '@nestjs/swagger';
import { PdfGeneratorService } from 'src/apidoc/services/pdf-generator.service';
import { OpenApiGeneratorService } from 'src/apidoc/services/openapi-generator.service';
import { HtmlGeneratorService } from 'src/apidoc/services/html-generator.service';
import { ApidocFormatDto } from '../dtos/apidoc-format.dto';
import { APIDOC_FORMAT } from '../enums/apidoc-format.enum';
import { HTTP } from 'src/common/enums/http-status-code.enum';

@ApiTags('apidoc')
@Controller('apidoc')
export class ApidocController {
  constructor(
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly openApiGeneratorService: OpenApiGeneratorService,
    private readonly htmlGeneratorService: HtmlGeneratorService,
  ) {}

  @Get('generate')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({
    summary:
      'Generate the RESTful API documentation in the specified format [Authorization: none]',
  })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'Document successfully generated.',
  })
  async generateDocumentation(
    @Query() query: ApidocFormatDto,
    @Res() res: Response,
  ) {
    const { format } = query;

    // Generate the document based on the format requested
    switch (format) {
      case APIDOC_FORMAT.PDF:
        const pdfBuffer: Buffer = await this.pdfGeneratorService.generatePdf();
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=api-documentation.pdf',
        });
        return res.send(pdfBuffer);

      case APIDOC_FORMAT.JSON:
        const openApiDocument: OpenAPIObject =
          this.openApiGeneratorService.generateOpenApiJson();
        res.set({
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename=api-documentation.json',
        });
        return res.send(openApiDocument);

      case APIDOC_FORMAT.HTML:
        const htmlDocument: string =
          await this.htmlGeneratorService.generateHtml();
        res.set({
          'Content-Type': 'text/html',
          'Content-Disposition': 'attachment; filename=api-documentation.html',
        });
        return res.send(htmlDocument);

      default:
        throw new BadRequestException(`Invalid format '${format}'`);
    }
  }
}
