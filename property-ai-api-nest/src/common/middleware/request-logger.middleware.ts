import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation-id.middleware';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      this.logger.log(
        JSON.stringify({
          correlation_id: req.headers[CORRELATION_ID_HEADER],
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          duration_ms: Math.round(durationMs),
        }),
      );
    });

    next();
  }
}
