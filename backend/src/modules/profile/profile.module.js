import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSchema } from '../../models/user.model.js';
import { SessionSchema } from '../../models/session.model.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ProfileController } from './profile.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }, { name: 'Session', schema: SessionSchema }]),
    JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config) => ({ secret: config.getOrThrow('JWT_SECRET') }) }),
  ],
  controllers: [ProfileController],
  providers: [JwtAuthGuard],
})
export class ProfileModule {}
