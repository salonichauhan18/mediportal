import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip for SUPER_ADMIN or non-authenticated routes
    if (!user || user.role === 'SUPER_ADMIN') {
      return next.handle();
    }

    // Identify the target branch or patient branch
    const branchId = request.headers['x-branch-id'] || user.branchId;
    
    if (user.branchId && branchId !== user.branchId) {
      throw new ForbiddenException('Cross-branch data access is strictly prohibited.');
    }

    // For specific record access (e.g., /patients/:id), we could add deeper checks here
    // But as a baseline, we enforce branchId consistency from the JWT/Header.

    return next.handle();
  }
}
