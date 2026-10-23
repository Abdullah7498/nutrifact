import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module.js';
import { SessionSchema } from '../../models/session.model.js';
import { PushDeviceSchema } from '../../models/push-device.model.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 3 }]),
    MongooseModule.forFeature([
      { name: 'PushDevice', schema: PushDeviceSchema },
      { name: 'Session', schema: SessionSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
