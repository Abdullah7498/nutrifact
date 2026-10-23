import { Body, Controller, Delete, HttpCode, HttpStatus, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { registerDeviceSchema, unregisterDeviceSchema } from './notifications.schema.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(notificationsService) {
    this.notificationsService = notificationsService;
  }

  @Post('devices')
  register(request, body) {
    return this.notificationsService.register(request.user, body);
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  unregister(request, body) {
    return this.notificationsService.unregister(request.user, body);
  }

  @Post('test')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  test(request) {
    return this.notificationsService.sendTest(request.user);
  }
}

Req()(NotificationsController.prototype, 'register', 0);
Body(new ZodValidationPipe(registerDeviceSchema))(NotificationsController.prototype, 'register', 1);
Req()(NotificationsController.prototype, 'unregister', 0);
Body(new ZodValidationPipe(unregisterDeviceSchema))(NotificationsController.prototype, 'unregister', 1);
Req()(NotificationsController.prototype, 'test', 0);
Inject(NotificationsService)(NotificationsController, undefined, 0);
