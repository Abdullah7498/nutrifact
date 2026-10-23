import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';

@Injectable()
export class JwtAuthGuard {
  constructor(
    jwtService,
    sessionModel,
  ) {
    this.jwtService = jwtService;
    this.sessionModel = sessionModel;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    let payload;

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid token');
    }

    const activeSession = await this.sessionModel.exists({
      _id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!activeSession) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    request.user = payload;
    return true;
  }
}

Inject(JwtService)(JwtAuthGuard, undefined, 0);
Inject(getModelToken('Session'))(JwtAuthGuard, undefined, 1);
