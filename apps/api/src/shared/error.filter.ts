import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@blowy/contract';
import type { Response } from 'express';
import { DEFAULT_MESSAGES, DomainError, HTTP_STATUS } from './errors';

/** Toute erreur sort au format du contrat : { error: { code, message } }. */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erreurs');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toBody(exception);
    res.status(status).json(body);
  }

  private toBody(exception: unknown): { status: number; body: ApiErrorBody } {
    if (exception instanceof DomainError) {
      return { status: HTTP_STATUS[exception.code], body: { error: { code: exception.code, message: exception.message } } };
    }
    if (exception instanceof HttpException) {
      const code = codeForStatus(exception.getStatus());
      const status = code === 'internal' ? 500 : HTTP_STATUS[code];
      return { status, body: { error: { code, message: DEFAULT_MESSAGES[code] } } };
    }
    // Ni le corps de la requête ni les jetons ne sont journalisés : seulement le type et le message technique.
    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(`${err.name}: ${err.message}`, err.stack);
    return { status: 500, body: { error: { code: 'internal', message: DEFAULT_MESSAGES.internal } } };
  }
}

function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
    case 413:
    case 415:
      return 'invalid';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
    case 405:
      return 'not_found';
    case 429:
      return 'rate_limited';
    default:
      return 'internal';
  }
}
