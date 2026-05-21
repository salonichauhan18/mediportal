import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, PrismaHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive system health check' })
  @ApiResponse({ status: 200, description: 'All systems are operational' })
  @ApiResponse({ status: 503, description: 'One or more systems are unhealthy' })
  check() {
    return this.health.check([
      // Database Health
      () => this.prisma.pingCheck('database', this.prismaService),
      
      // External API Health (e.g. Gemini)
      // () => this.http.pingCheck('gemini-api', 'https://generativelanguage.googleapis.com'),
      
      // Memory Usage (Heap should not exceed 1GB)
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),
      
      // Disk Storage (Ensure at least 50% free or specific threshold)
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }

  @Get('liveness')
  liveness() {
    return { status: 'up' };
  }
}
