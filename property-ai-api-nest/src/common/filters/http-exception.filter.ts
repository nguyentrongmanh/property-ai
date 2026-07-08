import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { EntityNotFoundError } from 'typeorm';
import { AiServiceException } from '../../ai/exceptions/ai-service.exception';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

/**
 * Renders every thrown error as {message, status_code}, mirroring the
 * Laravel app's bootstrap/app.php exception handling so API consumers see
 * the same predictable shape regardless of the backend.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AiServiceException) {
      if (exception.isRateLimited()) {
        response.setHeader('Retry-After', '60');
        response.status(HttpStatus.TOO_MANY_REQUESTS).json({
          message:
            'The AI service is receiving too many requests. Please try again in a minute.',
          status_code: HttpStatus.TOO_MANY_REQUESTS,
        });
        return;
      }

      response.status(HttpStatus.BAD_GATEWAY).json({
        message:
          'We could not process the maintenance request right now. Please try again shortly.',
        status_code: HttpStatus.BAD_GATEWAY,
      });
      return;
    }

    if (exception instanceof ThrottlerException) {
      response.setHeader('Retry-After', '60');
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        message: 'Too many requests.',
        status_code: HttpStatus.TOO_MANY_REQUESTS,
      });
      return;
    }

    if (exception instanceof EntityNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        message: 'Resource not found.',
        status_code: HttpStatus.NOT_FOUND,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null && 'errors' in body) {
        response.status(status).json({ ...body, status_code: status });
        return;
      }

      const rawMessage =
        typeof body === 'string'
          ? body
          : ((body as { message?: unknown }).message ?? exception.message);

      response.status(status).json({
        message: Array.isArray(rawMessage) ? rawMessage.join(' ') : rawMessage,
        status_code: status,
      });
      return;
    }

    const error =
      exception instanceof Error ? exception : new Error('Unknown error');

    this.logger.error(
      JSON.stringify({
        correlation_id: request.headers[CORRELATION_ID_HEADER],
        method: request.method,
        path: request.originalUrl,
        exception: error.name,
        reason: error.message,
      }),
      error.stack,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error.',
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
