import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/common/enums/user-type.enum';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'username',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Address of the user',
    example: '123 Baker Street',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Comment about the user',
    example: 'blabla',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({
    description: 'Type of the user',
    enum: UserType,
    example: UserType.USER,
    required: false,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;
}
