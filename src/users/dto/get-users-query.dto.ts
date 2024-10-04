import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/common/enums/user-type.enum';

export class GetUsersQueryDto {
  @ApiProperty({
    description: 'Filter by user type (optionnal)',
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;
}
