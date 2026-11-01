/**
 * Filtre d'erreurs unique : toute erreur devient {code,message,detailsSafe,requestId,retryable}.
 * Les erreurs inattendues sont journalisées (sans contenu sensible) et renvoyées en INTERNAL.
 */
import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { ApiError, ErrorCode } from '@blowy/api-contract';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../domain/errors.js';
import type { Logger } from '../infrastructure/logging/logger.js';
import type { BlowyRequest } from './request-context.js';

const HTTP_TO_CODE: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

export function toApiError(err: unknown, requestId: string): { status: number; body: ApiError; unexpected: boolean } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { code: err.code, message: err.message, ...(err.detailsSafe ? { detailsSafe: err.detailsSafe } : {}), requestId, retryable: err.retryable },
      unexpected: false,
    };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: 'VALIDATION_FAILED',
        message: 'Requête invalide',
        detailsSafe: { issues: err.issues.map((i) => ({ path: i.path.join('.'), code: i.code })) },
        requestId,
        retryable: false,
      },
      unexpected: false,
    };
  }
  if (err instanceof HttpException) {
    const status = err.getStatus();
    return { status, body: { code: HTTP_TO_CODE[status] ?? 'INTERNAL', message: err.message, requestId, retryable: false }, unexpected: false };
  }
  return { status: 500, body: { code: 'INTERNAL', message: 'Erreur interne', requestId, retryable: true }, unexpected: true };
}

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(err: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<BlowyRequest>();
    const res = ctx.getResponse<Response>();
    const requestId = req?.requestId ?? 'unknown';
    const { status, body, unexpected } = toApiError(err, requestId);
    if (unexpected) {
      this.logger.error({ requestId, err: { name: (err as Error)?.name, message: (err as Error)?.message, stack: (err as Error)?.stack } }, 'unexpected_error');
    }
    res.status(status).json(body);
  }
}
