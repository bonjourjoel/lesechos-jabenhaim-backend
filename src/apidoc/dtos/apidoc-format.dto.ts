import { IsEnum, IsNotEmpty } from 'class-validator';

import { APIDOC_FORMAT } from '../enums/apidoc-format.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ApidocFormatDto {
  @IsEnum(APIDOC_FORMAT)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Format of the document',
    enum: APIDOC_FORMAT,
    example: APIDOC_FORMAT.PDF,
    required: true,
  })
  format: APIDOC_FORMAT;
}
