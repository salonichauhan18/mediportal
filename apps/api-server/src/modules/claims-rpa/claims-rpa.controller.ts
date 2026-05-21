import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ClaimsRpaService } from './claims-rpa.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('claims-rpa')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClaimsRpaController {
  constructor(private readonly claimsRpaService: ClaimsRpaService) {}

  @Get('pipeline')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  async getPipeline() {
    return this.claimsRpaService.getPipelineStats();
  }

  @Get('manual-review')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  async getManualReview() {
    return this.claimsRpaService.getManualReviewQueue();
  }

  @Post('manual-override')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  async manualOverride(@Body() body: { claimId: string; status: 'SUBMITTED' | 'PAID'; reason: string }, @Req() req: any) {
    const staffId = req.user.staff?.id || req.user.id;
    return this.claimsRpaService.manualOverride(body.claimId, body.status, body.reason, staffId);
  }
}
