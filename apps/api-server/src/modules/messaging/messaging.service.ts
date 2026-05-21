import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MessagingService {
  constructor(
    private prisma: PrismaService,
    private gateway: SocketGateway,
  ) {}

  async sendMessage(senderId: string, data: { receiverId?: string; departmentId?: string; content: string }) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        departmentId: data.departmentId,
        content: data.content,
      },
      include: {
        sender: { include: { user: true } },
      },
    });

    if (data.receiverId) {
      this.gateway.server.to(`staff:${data.receiverId}`).emit('new_message', message);
    } else if (data.departmentId) {
      // Logic for department broadcast can be added here
    }

    return message;
  }

  async getChatHistory(staffId: string, otherStaffId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: staffId, receiverId: otherStaffId },
          { senderId: otherStaffId, receiverId: staffId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { include: { user: true } },
      },
    });
  }

  async getRecentChats(staffId: string) {
    // Basic logic to get unique staff members recently messaged
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: staffId }, { receiverId: staffId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { include: { user: true } },
        receiver: { include: { user: true } },
      },
    });

    // Transform into unique chat list
    return messages;
  }
}
