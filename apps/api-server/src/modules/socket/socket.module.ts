import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { NotificationService } from './notification.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret',
    }),
  ],
  providers: [SocketGateway, NotificationService],
  exports: [NotificationService, SocketGateway],
})
export class SocketModule {}
