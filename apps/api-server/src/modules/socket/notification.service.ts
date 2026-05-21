import { Injectable } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly gateway: SocketGateway,
    private readonly prisma: PrismaService,
  ) {}

  async createNotification(data: {
    staffId: string;
    title: string;
    content: string;
    type: 'CRITICAL_LAB' | 'LOW_STOCK' | 'APPOINTMENT';
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        staffId: data.staffId,
        title: data.title,
        content: data.content,
        type: data.type,
        link: data.link,
      },
    });

    this.gateway.sendNotification(data.staffId, notification);
    return notification;
  }

  async broadcastToRole(branchId: string, role: string, data: any) {
    this.gateway.sendToRole(branchId, role, 'notification', data);
  }

  async broadcastToBranch(branchId: string, data: any) {
    this.gateway.sendToBranch(branchId, 'notification', data);
  }
}
