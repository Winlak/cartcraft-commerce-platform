import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY, AuthenticatedUser } from "../common/auth.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthenticatedUser;
      }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new UnauthorizedException("Требуется авторизация");
    try {
      request.user = this.jwtService.verify<AuthenticatedUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException("Сессия истекла или недействительна");
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user || !roles.includes(user.role))
      throw new ForbiddenException("Недостаточно прав для этого действия");
    return true;
  }
}
