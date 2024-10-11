import { AllExceptionsLoggerFilter } from './log-all-exceptions.filter';
import { Logger as WinstonLogger } from 'winston';

describe('Unit Test: AllExceptionsLoggerFilter', () => {
  let mockWinstonLogger: WinstonLogger;

  beforeEach(() => {
    // Mock the Winston Logger with basic jest functions (mocking the methods used in the filter)
    mockWinstonLogger = {
      error: jest.fn(), // Mock the 'error' method as it's used in the filter
    } as unknown as WinstonLogger; // Cast to WinstonLogger to match the expected type
  });

  it('should be defined', () => {
    const filter = new AllExceptionsLoggerFilter(mockWinstonLogger); // Pass the mocked logger
    expect(filter).toBeDefined(); // Ensure the filter is properly instantiated
  });
});
