import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AppConfig } from '../config/configuration';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenService } from './refresh-token.service';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.config.get('bcryptSaltRounds', { infer: true }),
    );

    const user = await this.users.save(
      this.users.create({ name: dto.name, email: dto.email, passwordHash }),
    );

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const isValid = await this.refreshTokens.isValid(payload.sub, payload.jti);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.refreshTokens.revoke(payload.sub, payload.jti);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.refreshTokens.revoke(payload.sub, payload.jti);
    } catch {
      // An already-invalid or expired token has nothing left to revoke.
    }
  }

  async me(userId: string): Promise<User> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get('jwt.accessSecret', { infer: true }),
        expiresIn: this.config.get('jwt.accessExpiresIn', { infer: true }),
      },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
        expiresIn: this.config.get('jwt.refreshExpiresIn', { infer: true }),
      },
    );
    await this.refreshTokens.store(user.id, jti);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
