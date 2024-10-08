import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty()
  userType: string;
}
