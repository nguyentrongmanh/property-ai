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

interface ErrorResponseBody {
  message: string;
  status_code: number;
  errors?: Record<string, string[]>;
}

interface ResolvedError {
  status: number;
  body: ErrorResponseBody;
  retryAfterSeconds?: number;
}

/**
 * Renders every thrown error as {message, status_code}, mirroring the
 * Laravel app's bootstrap/app.php exception handling so API consumers see
 * the same predictable shape regardless of the backend. Every branch is
 * logged with the request's correlation ID - not just the 500 fallback -
 * so 404s, auth failures, validation errors, and AI/throttle failures all
 * stay traceable.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolve(exception);

    this.log(exception, request, resolved.status);

    if (resolved.retryAfterSeconds !== undefined) {
      response.setHeader('Retry-After', String(resolved.retryAfterSeconds));
    }

    response.status(resolved.status).json(resolved.body);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof AiServiceException) {
      if (exception.isRateLimited()) {
        return {
          status: HttpStatus.TOO_MANY_REQUESTS,
          body: {
            message:
              'The AI service is receiving too many requests. Please try again in a minute.',
            status_code: HttpStatus.TOO_MANY_REQUESTS,
          },
          retryAfterSeconds: 60,
        };
      }

      return {
        status: HttpStatus.BAD_GATEWAY,
        body: {
          message:
            'We could not process the maintenance request right now. Please try again shortly.',
          status_code: HttpStatus.BAD_GATEWAY,
        },
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: {
          message: 'Too many requests.',
          status_code: HttpStatus.TOO_MANY_REQUESTS,
        },
        retryAfterSeconds: 60,
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          message: 'Resource not found.',
          status_code: HttpStatus.NOT_FOUND,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'errors' in responseBody
      ) {
        return {
          status,
          body: {
            ...(responseBody as object),
            status_code: status,
          } as ErrorResponseBody,
        };
      }

      const rawMessage =
        typeof responseBody === 'string'
          ? responseBody
          : ((responseBody as { message?: unknown }).message ??
            exception.message);

      return {
        status,
        body: {
          message: Array.isArray(rawMessage)
            ? rawMessage.join(' ')
            : (rawMessage as string),
          status_code: status,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        message: 'Internal server error.',
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    };
  }

  private log(exception: unknown, request: Request, status: number): void {
    const error =
      exception instanceof Error ? exception : new Error('Unknown error');

    const context = {
      event: 'request.failed',
      correlation_id: request.headers[CORRELATION_ID_HEADER],
      method: request.method,
      path: request.originalUrl,
      status_code: status,
      exception: error.name,
      reason: error.message,
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(context), error.stack);
    } else {
      this.logger.warn(JSON.stringify(context));
    }
  }
}
