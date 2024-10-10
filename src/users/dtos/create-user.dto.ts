import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { USER_TYPE } from 'src/common/enums/user-type.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Username of the user', example: 'username' })
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: 'Username should not be empty' })
  username: string;

  @ApiProperty({ description: 'Password of the user', example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;

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
    enum: USER_TYPE,
    example: USER_TYPE.USER,
  })
  @IsEnum(USER_TYPE)
  @IsNotEmpty()
  userType: USER_TYPE;
}
