import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';
import { requestLoggerOptions } from './common/middleware/request-logger.middleware.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { DatabaseModule } from './database/databae.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(requestLoggerOptions),

    ObserveModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService) => ({
        appKey: configService.getOrThrow('OBSERVE_APP_KEY'),
        appSecret: configService.getOrThrow('OBSERVE_APP_SECRET'),
        serviceId: 'backend',
      }),
    }),

    DatabaseModule,
    AuthModule,
    ProfileModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
  ],
})
export class AppModule {}
