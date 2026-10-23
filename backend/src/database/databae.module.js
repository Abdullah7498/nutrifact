import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService) => {
        const uri = configService.getOrThrow('MONGODB_URI');

        console.log('MongoDB URI check:', {
          type: typeof uri,
          validPrefix: /^mongodb(\+srv)?:\/\//.test(uri),
          hasWhitespace: uri !== uri.trim(),
        });

        return { uri: uri.trim() };
      },
    }),
  ],
})
export class DatabaseModule {}
