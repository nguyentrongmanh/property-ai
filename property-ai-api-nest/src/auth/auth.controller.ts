import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return { data: this.serializeTokens(await this.auth.register(dto)) };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return { data: this.serializeTokens(await this.auth.login(dto)) };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return {
      data: this.serializeTokens(await this.auth.refresh(dto.refresh_token)),
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refresh_token);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return { data: this.serializeUser(await this.auth.me(user.id)) };
  }

  private serializeTokens(tokens: AuthTokens) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: tokens.user,
    };
  }

  private serializeUser(user: User) {
    return { id: user.id, name: user.name, email: user.email };
  }
}
