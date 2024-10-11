import { OwnUserGuard } from './own-user.guard';

describe('Unit Test: OwnUserGuard', () => {
  it('should be defined', () => {
    expect(new OwnUserGuard()).toBeDefined();
  });
});
