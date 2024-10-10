import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthenticatedRequest } from 'src/auth/types/authenticated-request.interface';
import { Logger as WinstonLogger } from 'winston';

@Catch()
export class AllExceptionsLoggerFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const method = request.method;
    const originalUrl = request.url;
    const ip = request.ip;
    const body = request.body || {};
    const user = request.user ? request.user.username : 'unauth';
    const errorMessage = exception.message || 'Unknown internal server error';
    const stackTrace = exception.stack || 'No stack trace available';

    // Log exception with stack trace
    this.winstonLogger.error(
      `IP: ${ip}, User: ${user}, Method: ${method}, URL: ${originalUrl}, RequestBody: ${JSON.stringify(body)}, ResponseStatus: ${status}, ErrorMessage: ${errorMessage}, Stack: ${stackTrace}`,
    );

    // Send the response to the client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}
