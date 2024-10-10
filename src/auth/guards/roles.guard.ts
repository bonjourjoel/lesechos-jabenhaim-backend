import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { USER_TYPE } from 'src/common/enums/user-type.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly allowedRoles: USER_TYPE[];

  constructor(...allowedRoles: USER_TYPE[]) {
    // if no allowed roles specified, allow all by default
    this.allowedRoles =
      allowedRoles.length > 0 ? allowedRoles : Object.values(USER_TYPE);
  }

  /**
   * Syntax to use this guard above a controller route:
   *    @UseGuards(AuthGuard('jwt'), new RolesGuard(UserType.ADMIN, UserType.USER))
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Defined by JwtStrategy

    if (!this.allowedRoles.includes(user.userType)) {
      throw new ForbiddenException('Access denied');
    }

    return true; // Authorize access
  }
}
