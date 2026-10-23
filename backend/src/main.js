import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    bufferLogs: true,
  });
  app.useBodyParser('json', { limit: '8mb' });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
