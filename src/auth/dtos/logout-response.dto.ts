import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Message confirming successful logout',
    example: 'Logout successful for userId=12345',
  })
  message: string;
}
