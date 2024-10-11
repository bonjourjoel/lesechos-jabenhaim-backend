import { IsInt, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { USER_TYPE } from 'src/common/enums/user-type.enum';

class AuthResponseUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user (integer)',
    example: 42,
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Username of the authenticated user',
    example: 'john_doe',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Type of the user (e.g., admin, regular)',
    example: USER_TYPE.ADMIN,
  })
  @IsString()
  userType: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token to obtain a new access token when expired',
    example: 'def50200434e0845c672f1...',
  })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: 'Details of the authenticated user',
    type: AuthResponseUserDto,
  })
  user: AuthResponseUserDto;
}
