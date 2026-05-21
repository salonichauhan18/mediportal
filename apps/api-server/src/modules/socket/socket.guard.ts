import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

/**
 * WsJwtGuard: Secures WebSocket connections using JWT tokens.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      // Support both handshake auth and headers
      const authToken = client.handshake.auth?.token || 
                        client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!authToken) {
        return false;
      }

      const payload = await this.jwtService.verifyAsync(authToken);
      // Attach user payload to the socket data
      context.switchToWs().getData().user = payload;
      
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
