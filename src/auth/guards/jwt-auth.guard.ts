import { ExecutionContext, Injectable } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Syntax to use this guard above a controller route:
   *    @UseGuards(new JwtAuthGuard())
   */
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // console.log('Request Headers:', request.headers);
    return super.canActivate(context);
  }
}
