import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation-id.middleware';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const correlationId = req.headers[CORRELATION_ID_HEADER];

    this.logger.log(
      JSON.stringify({
        event: 'request.started',
        correlation_id: correlationId,
        method: req.method,
        path: req.originalUrl,
      }),
    );

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      this.logger.log(
        JSON.stringify({
          event: 'request.completed',
          correlation_id: correlationId,
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
