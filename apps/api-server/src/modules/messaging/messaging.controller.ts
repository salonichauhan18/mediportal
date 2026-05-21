import { Controller, Post, Get, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('messaging')
@Controller('messaging')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveStaff(req: any) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new BadRequestException('User is not a staff member');
    return staff;
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a message to another staff member' })
  async sendMessage(@Req() req: any, @Body() dto: any) {
    const staff = await this.resolveStaff(req);
    return this.messagingService.sendMessage(staff.id, dto);
  }

  @Get('history/:otherStaffId')
  @ApiOperation({ summary: 'Get chat history with another staff member' })
  async getHistory(@Req() req: any, @Param('otherStaffId') otherStaffId: string) {
    const staff = await this.resolveStaff(req);
    return this.messagingService.getChatHistory(staff.id, otherStaffId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent chats for the logged-in staff' })
  async getRecent(@Req() req: any) {
    const staff = await this.resolveStaff(req);
    return this.messagingService.getRecentChats(staff.id);
  }
}
