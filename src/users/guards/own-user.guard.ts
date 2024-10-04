import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserType } from 'src/common/enums/user-type.enum';

@Injectable()
export class OwnUserGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // User from JWT

    // Get the userId from the route parameters
    const { id } = request.params;

    // Allow access if the user is an admin or if the userId matches
    if (user.userType === UserType.ADMIN || user.userId === Number(id)) {
      return true; // Allow access
    }

    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
}
