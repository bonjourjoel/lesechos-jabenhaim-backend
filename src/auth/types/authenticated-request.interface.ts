import { Request } from 'express';

/**
 * Use in controllers like this to get strong typings:
 *    @POST
 *    async post(@Request() req: AuthenticatedRequest) {

 */

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    userType: string;
  };
}
