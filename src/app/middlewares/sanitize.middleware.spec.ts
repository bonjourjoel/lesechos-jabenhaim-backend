import { SanitizeMiddleware } from './sanitize.middleware';

describe('Unit Test: SanitizeMiddleware', () => {
  it('should be defined', () => {
    expect(new SanitizeMiddleware()).toBeDefined();
  });
});
