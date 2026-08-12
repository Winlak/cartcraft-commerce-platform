import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import { Role } from "@prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    return context.switchToHttp().getRequest<{ user: AuthenticatedUser }>()
      .user;
  },
);
