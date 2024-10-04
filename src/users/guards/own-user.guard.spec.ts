import { OwnUserGuard } from './own-user.guard';

describe('OwnUserGuard', () => {
  it('should be defined', () => {
    expect(new OwnUserGuard()).toBeDefined();
  });
});
