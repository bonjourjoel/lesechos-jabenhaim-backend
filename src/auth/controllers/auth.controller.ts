import {
  Controller,
  Post,
  Body,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: LoginDto })
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User successfully logged in.',
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Delete('logout')
  @UseGuards(new JwtAuthGuard())
  @ApiOperation({ summary: 'Logout a user' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User successfully logged out.',
  })
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }
}
