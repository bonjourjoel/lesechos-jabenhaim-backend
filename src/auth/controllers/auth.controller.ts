import {
  Controller,
  Post,
  Body,
  Delete,
  Request,
  UseGuards,
  HttpCode,
  InternalServerErrorException,
  UsePipes,
  ValidationPipe,
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
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HTTP._200_OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: LoginDto })
  @ApiOperation({ summary: 'Login a user [Authorization: none]' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User successfully logged in.',
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HTTP._200_OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Refresh access token using refresh token [Authorization: none]',
  })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'Token successfully refreshed.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Send refresh token to get a new access token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.authService.refreshToken(
      payload.sub,
      refreshTokenDto.refreshToken,
    );
  }

  @Delete('logout')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseGuards(new JwtAuthGuard())
  @ApiOperation({ summary: 'Logout a user [Authorization: authenticated]' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User successfully logged out.',
  })
  async logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.userId);
  }
}
