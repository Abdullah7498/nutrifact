import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';

const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function newRefreshTokenSecret() {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class AuthService {
  constructor(
    userModel,
    sessionModel,
    jwtService,
    pushDeviceModel,
  ) {
    this.userModel = userModel;
    this.sessionModel = sessionModel;
    this.jwtService = jwtService;
    this.pushDeviceModel = pushDeviceModel;
    this.logger = new Logger(AuthService.name);
  }

  async register(body) {
    const { name, username, email, password } = body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await this.userModel.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.email === normalizedEmail
          ? 'Email already exists'
          : 'Username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let user;

    try {
      user = await this.userModel.create({
        name,
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email or username already exists');
      }

      throw error;
    }

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileComplete: !!user.nutritionProfile?.completedAt,
      },
    };
  }

  async login(body) {
    const { email, password } = body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('+password');

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const secret = newRefreshTokenSecret();
    const session = await this.sessionModel.create({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(secret),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
    });

    const accessToken = await this.signAccessToken(user, session.id);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken: `${session.id}.${secret}`,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileComplete: !!user.nutritionProfile?.completedAt,
      },
    };
  }

  async refresh(body) {
    const [sessionId, secret, extra] = body.refreshToken.split('.');

    if (
      !/^[a-f\d]{24}$/i.test(sessionId ?? '') ||
      !/^[A-Za-z0-9_-]{43}$/.test(secret ?? '') ||
      extra !== undefined
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextSecret = newRefreshTokenSecret();
    const now = new Date();
    const session = await this.sessionModel.findOneAndUpdate(
      {
        _id: sessionId,
        refreshTokenHash: hashRefreshToken(secret),
        expiresAt: { $gt: now },
        revokedAt: null,
      },
      {
        $set: {
          refreshTokenHash: hashRefreshToken(nextSecret),
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
        },
      },
      { new: true },
    );

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel.findById(session.userId);

    if (!user || !user.isActive) {
      await this.sessionModel.updateOne(
        { _id: session.id },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      accessToken: await this.signAccessToken(user, session.id),
      refreshToken: `${session.id}.${nextSecret}`,
      tokenType: 'Bearer',
      user: { id: user.id, name: user.name, username: user.username, email: user.email, profileComplete: !!user.nutritionProfile?.completedAt },
    };
  }
  async logout(user) {
    const result = await this.sessionModel.updateOne(
      { _id: user.sid, userId: user.sub, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    if (result.modifiedCount !== 1) {
      throw new UnauthorizedException('Session not found');
    }
    await this.pushDeviceModel.deleteMany({ sessionId: user.sid }).catch((error) => {
      this.logger.error('Could not remove push devices for revoked session', error?.stack || String(error));
    });
  }

  signAccessToken(user, sessionId) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      sid: sessionId,
    });
  }
}

Inject(getModelToken('User'))(AuthService, undefined, 0);
Inject(getModelToken('Session'))(AuthService, undefined, 1);
Inject(JwtService)(AuthService, undefined, 2);
Inject(getModelToken('PushDevice'))(AuthService, undefined, 3);
