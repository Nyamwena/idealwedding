import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const authServiceBase = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

    try {
      const response = await fetch(`${authServiceBase}/api/v1/auth/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid token');
      }

      const payload = (await response.json()) as {
        data?: { user?: { id: string; email: string; role: string } };
      };
      if (!payload?.data?.user?.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = payload.data.user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
