import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { firebaseMessaging } from './firebase.messaging.js';

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);
const MAX_BATCH_SIZE = 500;
const ACTIVE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationsService {
  constructor(pushDeviceModel, sessionModel) {
    this.pushDeviceModel = pushDeviceModel;
    this.sessionModel = sessionModel;
    this.logger = new Logger(NotificationsService.name);
    this.messaging = firebaseMessaging;
  }

  async register(user, { token, platform }) {
    await this.pushDeviceModel.updateOne(
      { token },
      {
        $set: {
          userId: user.sub,
          sessionId: user.sid,
          platform,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true },
    );
    await this.pushDeviceModel.deleteMany({
      token: { $ne: token },
      userId: user.sub,
      sessionId: user.sid,
    });
    return { registered: true };
  }

  async unregister(user, { token }) {
    await this.pushDeviceModel.deleteOne({ token, userId: user.sub, sessionId: user.sid });
  }

  async sendToUser(userId, notification) {
    const devices = await this.pushDeviceModel.find({
      userId,
      lastSeenAt: { $gt: new Date(Date.now() - ACTIVE_WINDOW_MS) },
    }).lean();
    if (devices.length === 0) return { sent: 0, failed: 0 };

    const sessionIds = [...new Set(devices.map((device) => String(device.sessionId)))];
    const sessions = await this.sessionModel.find({
      _id: { $in: sessionIds },
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select('_id').lean();
    const activeSessions = new Set(sessions.map((session) => String(session._id)));
    const activeDevices = devices.filter((device) => activeSessions.has(String(device.sessionId)));
    if (activeDevices.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;
    const invalidTokens = [];
    try {
      const messaging = this.messaging();
      for (let offset = 0; offset < activeDevices.length; offset += MAX_BATCH_SIZE) {
        const batch = activeDevices.slice(offset, offset + MAX_BATCH_SIZE);
        const result = await messaging.sendEachForMulticast({
          tokens: batch.map((device) => device.token),
          notification,
        });
        sent += result.successCount;
        failed += result.failureCount;
        result.responses.forEach((response, index) => {
          if (!response.success && INVALID_TOKEN_CODES.has(response.error?.code)) {
            invalidTokens.push(batch[index].token);
          }
        });
      }
    } catch (error) {
      this.logger.error('FCM send failed', error?.stack || String(error));
      throw new ServiceUnavailableException('Push delivery is unavailable');
    }

    if (invalidTokens.length) {
      await this.pushDeviceModel.deleteMany({ token: { $in: invalidTokens } }).catch((error) => {
        this.logger.error('Could not remove invalid push tokens', error?.stack || String(error));
      });
    }
    return { sent, failed };
  }

  async sendTest(user) {
    const result = await this.sendToUser(user.sub, {
      title: 'Nutrifact test notification',
      body: 'Push notifications are working for your account.',
    });
    if (result.sent === 0 && result.failed === 0) {
      throw new BadRequestException('No registered device found. Enable notifications first.');
    }
    return result;
  }
}

Inject(getModelToken('PushDevice'))(NotificationsService, undefined, 0);
Inject(getModelToken('Session'))(NotificationsService, undefined, 1);
