import 'winston-daily-rotate-file';

import * as fs from 'fs';
import * as winston from 'winston';

import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

/**
 * LoggerModule - Provides a structured logging system using Winston.
 *
 * This module sets up a logger with the following features:
 *
 * 1. **Multiple Transports**: Logs are written both to the console and to files.
 *    - The file logs are rotated based on time (daily rotation), with compressed archives.
 *    - Log files are stored in the `/logs` directory, and filenames are based on date and time (`log-YYYY-MM-DD-HH.log`).
 *
 * 2. **HTTP Request and Response Logging**:
 *    - A middleware logs all incoming HTTP requests, including details like IP, method, URL, body, and user (if authenticated).
 *    - The response is logged once sent, including response data, status, duration, and a summary of large or binary responses (e.g., file size or name).
 *    - For unauthenticated requests, the user is logged as "unauth".
 *    Usage (in app.module.ts):
 *      configure(consumer: MiddlewareConsumer) {
 *        consumer
 *        .apply(RequestLoggerMiddleware) // Use the class, not an instance
 *        .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes
 *      }
 *
 * 3. **Error Handling**:
 *    - A global exception filter logs all uncaught exceptions with the error message and status code.
 *    - Errors are logged on a separate line with the `ERROR` level for clear distinction.
 *    Usage (in bootstrap): app.useGlobalFilters(app.get(AllExceptionsLoggerFilter));
 *
 * 4. **Injectable Logger Service**:
 *    - The logger is exposed as a service, allowing developers to log messages manually with different severity levels (`log`, `error`, `warn`, `debug`, `verbose`).
 *    Usage:
 *      constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}
 *      OR: const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
 *      ...
 *      this.logger.log('Log message');
 *
 * 5. **Optional Datadog Integration**:
 *    - If the environment variable `LOGGER_DATADOG_API_KEY` is set, logs will also be sent to Datadog using a dedicated transport.
 *
 * 6. **Using in unit tests**:
 *    - Add `LoggerModule` to `createTestingModule` in your tests
 *    Example:
 *        const app = await Test.createTestingModule({
 *          imports: [LoggerModule],
 *        }).compile();
 *
 * ### Environment Variables:
 *
 * - `LOGGER_ENABLE_CONSOLE_LOG`:
 *   - **Description**: Enables or disables console logging.
 *   - **Possible Values**: `true` (enable console logging) or `false` (disable console logging).
 *   - **Example**:
 *        export LOGGER_ENABLE_CONSOLE_LOG=true
 *
 * - `LOGGER_ENABLE_FILE_LOG`:
 *   - **Description**: Enables or disables file logging with log rotation.
 *   - **Possible Values**: `true` (enable file logging) or `false` (disable file logging).
 *   - **Example**:
 *        export LOGGER_ENABLE_FILE_LOG=true
 *
 * - `LOGGER_DATADOG_API_KEY`:
 *   - **Description**: If set, enables logging to Datadog via HTTP API.
 *   - **Optionnal**: A valid Datadog API key.
 *   - **Example**:
 *        export LOGGER_DATADOG_API_KEY=your-datadog-api-key
 */

// Ensure log directory exists
const LOG_DIR = 'logs';
if (process.env.LOGGER_ENABLE_FILE_LOG === 'true' && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create a unique filename based on server start time
const serverStartTime = new Date()
  .toISOString() // Returns the date in standard ISO format (UTC)
  .replace('T', '--') // Replaces the 'T' that separates the date and time with a double hyphen
  .replace(/\..+/, '') // Removes milliseconds and the 'Z' at the end
  .replace(/:/g, '-'); // Replaces colons with hyphens for hours/minutes/seconds
const logFilename = `log-${serverStartTime}-${process.env.NODE_ENV}.log`;

// Custom text format
const customTextFormat = winston.format.printf(
  ({ level, message, timestamp }) => {
    return `\n***** ${timestamp} ${level}: ${message}`;
  },
);

// Custom JSON format
const customJsonFormat = winston.format.printf(
  ({ timestamp, level, message, ...rest }) => {
    return JSON.stringify({
      timestamp, // Place timestamp first
      level,
      message,
      ...rest, // Include additional metadata
    });
  },
);

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        // Console logging, if enabled via environment variables
        ...(process.env.LOGGER_ENABLE_CONSOLE_LOG === 'true'
          ? [
              new winston.transports.Console({
                format: winston.format.combine(
                  winston.format.timestamp(), // Add timestamp
                  customTextFormat, // Custom text format for console
                ),
              }),
            ]
          : []),

        // File logging with a unique filename at server start, if enabled via environment variables
        ...(process.env.LOGGER_ENABLE_FILE_LOG === 'true'
          ? [
              new winston.transports.File({
                dirname: LOG_DIR, // Directory for log files
                filename: logFilename, // Unique filename per server start
                maxFiles: 100, // Keep the last 100 files
                maxsize: 20 * 1024 * 1024, // 20 MB in bytes
                format: winston.format.combine(
                  winston.format.timestamp(), // Add timestamp
                  customTextFormat, // Custom text format for file
                ),
              }),
            ]
          : []),

        // Datadog transport via HTTP API,  if enabled via environment variables
        ...(process.env.LOGGER_DATADOG_API_KEY?.trim()
          ? [
              new winston.transports.Http({
                host: 'http-intake.logs.datadoghq.com',
                path: `/api/v2/logs?dd-api-key=${process.env.LOGGER_DATADOG_API_KEY}&ddsource=nodejs&service=my-service`,
                ssl: true,
                format: winston.format.combine(
                  winston.format.timestamp(), // Add timestamp
                  customJsonFormat, // custom JSON format for Datadog logs
                ),
                batch: true, // Enable batching of logs to reduce the number of HTTP requests
                batchInterval: 5000, // Time (in milliseconds) to wait before sending logs (default: 5000ms)
                batchCount: 10, // Number of logs to accumulate before sending (default: 10)
              }),
            ]
          : []),
      ],
    }),
  ],
})
export class LoggerModule {}
