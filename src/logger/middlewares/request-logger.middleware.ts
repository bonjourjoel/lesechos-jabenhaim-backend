import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { AuthenticatedRequest } from 'src/auth/types/authenticated-request.interface';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const body = req.body || {};
    const user = req.user ? req.user.username : 'unauth';

    // Generate a unique ID for the request
    const requestId = uuidv4();
    req['requestId'] = requestId; // Attach the request ID to the request object for later use

    const startTime = Date.now(); // Start time for measuring request duration

    // Log the start of the request
    this.winstonLogger.info(
      `<==== [RequestID: ${requestId}] Incoming Request: IP: ${ip}, User: ${user}, Method: ${method}, URL: ${originalUrl}, RequestBody: ${JSON.stringify(body)}`,
    );

    // Buffer to collect the response
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks: Buffer[] = [];

    // Overriding res.write
    res.write = (chunk: any, ...args: any[]): boolean => {
      chunks.push(Buffer.from(chunk)); // Collect the chunks
      return oldWrite.apply(res, [chunk, ...args]); // Call the original write method
    };

    // Overriding res.end
    res.end = (
      chunk: any,
      ...args: any[]
    ): Response<any, Record<string, any>> => {
      if (chunk) {
        chunks.push(Buffer.from(chunk)); // Collect the final chunk if available
      }

      const body = Buffer.concat(chunks).toString('utf8'); // Capture the response body
      res.locals.responseData = body; // Store the response in res.locals

      return oldEnd.apply(res, [chunk, ...args]); // Call the original end method and return the response
    };

    // Capture the finish event for logging response details
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime; // Calculate request duration

      const responseData = res.locals.responseData || ''; // Capture response data
      let responseLog = '';

      // If the response contains a file, log the file name and size
      if (res.locals.filePath) {
        const fileStats = fs.statSync(res.locals.filePath); // Get file stats
        responseLog = `File: ${res.locals.filePath}, Size: ${fileStats.size} bytes`;
      } else {
        // Limit the length of response data if it's too long
        const MAX_RESPONSE_SIZE = 1000;
        responseLog =
          responseData.length > MAX_RESPONSE_SIZE
            ? responseData.substring(0, MAX_RESPONSE_SIZE) + '[...]'
            : responseData;
      }

      // Log the request and response together at the end
      this.winstonLogger.info(
        `====> [RequestID: ${requestId}] Outgoing Response: Method: ${method}, URL: ${originalUrl}, ResponseStatus: ${statusCode}, Duration: ${duration}ms, Response: ${responseLog}`,
      );
    });

    // Capture errors in the request handling pipeline
    try {
      next();
    } catch (error) {
      const statusCode = error.status || 500;
      const duration = Date.now() - startTime; // Calculate request duration at the moment of the error
      this.winstonLogger.error(
        `!!!!> [RequestID: ${requestId}] Exception: Method: ${method}, URL: ${originalUrl}, ResponseStatus: ${statusCode}, Duration: ${duration}ms, ErrorMessage: ${error.message}`,
      );
      throw error; // Re-throw the error to allow global filters to handle it
    }
  }
}
