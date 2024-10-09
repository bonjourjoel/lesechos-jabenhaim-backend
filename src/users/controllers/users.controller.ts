import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { HTTP } from 'src/common/enums/http-status-code.enum';
import { UserType } from 'src/common/enums/user-type.enum';
import { CreateUserDto } from '../dtos/create-user.dto';
import { GetUsersQueryDto } from '../dtos/get-users-query.dto';
import { UserDto } from '../dtos/user.dto';
import { OwnUserGuard } from '../guards/own-user.guard';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(new JwtAuthGuard(), new RolesGuard(UserType.ADMIN))
  @ApiOperation({
    summary: 'Retrieve users with optional filters, sorting, and pagination',
    description:
      'Example: /users?username=john&sortBy=id&sortDir=asc&page=1&limit=10',
  })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserDto] })
  async getAllUsers(@Query() query: GetUsersQueryDto): Promise<UserDto[]> {
    const users = await this.usersService.findAllUsers(query);
    return users;
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(new JwtAuthGuard(), new OwnUserGuard())
  @ApiOperation({ summary: 'Retrieve a user by ID (own user only, or ADMIN)' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User found.',
    type: UserDto,
  })
  @ApiResponse({ status: HTTP._404_NOT_FOUND, description: 'User not found.' })
  async getUser(@Param('id') id: number): Promise<UserDto> {
    const user = await this.usersService.findUserById(id);
    return user;
  }

  @Post('')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Create a new user (opened endpoint)' })
  @ApiBody({ type: CreateUserDto, description: 'User registration details' })
  @ApiResponse({
    status: HTTP._201_CREATED,
    description: 'User successfully created.',
    type: UserDto,
  })
  @ApiResponse({
    status: HTTP._400_BAD_REQUEST,
    description: 'Validation failed.',
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.usersService.createUser(createUserDto);
    return user;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(new JwtAuthGuard(), new OwnUserGuard())
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Update a user by ID (own user only, or ADMIN)' })
  @ApiBody({ type: CreateUserDto, description: 'User registration details' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User updated.',
    type: UserDto,
  })
  @ApiResponse({ status: HTTP._404_NOT_FOUND, description: 'User not found.' })
  async updateUser(
    @Param('id') id: number,
    @Body() body: Partial<CreateUserDto>,
  ): Promise<UserDto> {
    const user = await this.usersService.updateUser(id, body);
    return user;
  }

  @Delete(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(new JwtAuthGuard(), new OwnUserGuard())
  @ApiOperation({ summary: 'Delete a user by ID (own user only, or ADMIN)' })
  @ApiResponse({
    status: HTTP._200_OK,
    description: 'User deleted.',
    type: UserDto,
  })
  @ApiResponse({ status: HTTP._404_NOT_FOUND, description: 'User not found.' })
  async deleteUser(@Param('id') id: number): Promise<UserDto> {
    const user = await this.usersService.deleteUser(id);
    return user;
  }
}
