import { MultipartJsonMiddleware } from './multipart-json.middleware';

describe('Unit Test: MultipartJsonMiddleware', () => {
  it('should be defined', () => {
    expect(new MultipartJsonMiddleware()).toBeDefined();
  });
});
