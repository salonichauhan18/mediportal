import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './socket.guard';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedStaff = new Map<string, string>(); // socketId -> staffId

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedStaff.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('register')
  async handleRegister(client: Socket, data: { staffId: string; branchId: string; role: string }) {
    this.connectedStaff.set(client.id, data.staffId);
    
    // Join branch room
    client.join(`branch:${data.branchId}`);
    
    // Join role-specific room within branch
    client.join(`branch:${data.branchId}:${data.role}`);
    
    // Join personal room for 1:1 messages
    client.join(`staff:${data.staffId}`);

    console.log(`Staff ${data.staffId} registered in branch ${data.branchId} as ${data.role}`);
    return { status: 'registered' };
  }

  sendNotification(staffId: string, notification: any) {
    this.server.to(`staff:${staffId}`).emit('notification', notification);
  }

  sendToBranch(branchId: string, event: string, data: any) {
    this.server.to(`branch:${branchId}`).emit(event, data);
  }

  sendToRole(branchId: string, role: string, event: string, data: any) {
    this.server.to(`branch:${branchId}:${role}`).emit(event, data);
  }
}
