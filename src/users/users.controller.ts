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
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { GetUsersQueryDto } from './dtos/get-users-query.dto';
import { UserDto } from './dtos/user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users.',
    type: UserDto,
    isArray: true,
  })
  async getAllUsers(@Query() query: GetUsersQueryDto): Promise<UserDto[]> {
    const users = await this.usersService.findAllUsers(query.userType);
    return users;
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiResponse({ status: 200, description: 'User found.', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUser(@Param('id') id: number): Promise<UserDto> {
    const user = await this.usersService.findUserById(id);
    return user;
  }

  @Post('')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto, description: 'User registration details' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  async register(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.usersService.createUser(createUserDto);
    return user;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Update a user' })
  @ApiBody({ type: CreateUserDto, description: 'User registration details' })
  @ApiResponse({ status: 200, description: 'User updated.', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(
    @Param('id') id: number,
    @Body() body: Partial<CreateUserDto>,
  ): Promise<UserDto> {
    const user = await this.usersService.updateUser(id, body);
    return user;
  }

  @Delete(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted.', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Param('id') id: number): Promise<UserDto> {
    const user = await this.usersService.deleteUser(id);
    return user;
  }
}
