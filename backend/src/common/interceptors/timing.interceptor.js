import { Injectable, Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor {
  logger = new Logger(TimingInterceptor.name);

  intercept(context, next) {
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.debug(`API took ${Date.now() - start}ms`);
      }),
    );
  }
}
