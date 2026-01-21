import { BasicStrategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(BasicStrategy) {
  constructor(private configService: ConfigService) {
    super();
  }

  validate(username: string, password: string): any {
    const envUser = this.configService.get<string>('BASIC_AUTH_USER');
    const envPass = this.configService.get<string>('BASIC_AUTH_PASSWORD');

    if (username === envUser && password === envPass) {
      return { username, role: 'admin' };
    }
    throw new UnauthorizedException();
  }
}
