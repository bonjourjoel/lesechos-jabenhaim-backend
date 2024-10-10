import { SanitizeMiddleware } from './sanitize.middleware';

describe('SanitizeMiddleware', () => {
  it('should be defined', () => {
    expect(new SanitizeMiddleware()).toBeDefined();
  });
});
