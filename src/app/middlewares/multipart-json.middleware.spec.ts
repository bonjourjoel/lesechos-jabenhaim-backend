import { MultipartJsonMiddleware } from './multipart-json.middleware';

describe('MultipartJsonMiddleware', () => {
  it('should be defined', () => {
    expect(new MultipartJsonMiddleware()).toBeDefined();
  });
});
