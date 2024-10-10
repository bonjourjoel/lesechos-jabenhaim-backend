import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { USER_TYPE } from 'src/common/enums/user-type.enum';

export class GetUsersQueryDto {
  @ApiProperty({ required: false, description: 'Filter by username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false, description: 'Filter by name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Filter by address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: 'Filter by comment' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by user type',
    enum: USER_TYPE,
  })
  @IsOptional()
  @IsEnum(USER_TYPE)
  userType?: USER_TYPE;

  @ApiProperty({ required: false, description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sorting direction',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Limit of results per page',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
