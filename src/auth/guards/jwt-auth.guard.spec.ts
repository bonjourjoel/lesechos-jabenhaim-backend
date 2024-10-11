import { JwtAuthGuard } from './jwt-auth.guard';

describe('Unit Test: JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });
});
