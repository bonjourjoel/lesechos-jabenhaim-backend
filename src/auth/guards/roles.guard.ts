import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserType } from 'src/common/enums/user-type.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly allowedRoles: UserType[];

  constructor(...allowedRoles: UserType[]) {
    // if no allowed roles specified, allow all by default
    this.allowedRoles =
      allowedRoles.length > 0 ? allowedRoles : Object.values(UserType);
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
