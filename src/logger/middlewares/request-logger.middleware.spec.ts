import { RequestLoggerMiddleware } from './request-logger.middleware';
import { Logger as WinstonLogger } from 'winston';

// Import the Logger type from winston

describe('Unit Test: RequestLoggerMiddleware', () => {
  let mockWinstonLogger: WinstonLogger; // Define a mock logger

  beforeEach(() => {
    // Mock the Winston Logger with basic jest functions (mocking the methods used in the middleware)
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as WinstonLogger; // Cast as WinstonLogger to match the expected type
  });

  it('should be defined', () => {
    const middleware = new RequestLoggerMiddleware(mockWinstonLogger);
    expect(middleware).toBeDefined(); // Ensure the middleware is properly instantiated
  });
});
