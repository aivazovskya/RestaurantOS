import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * EventsGateway
 * Manages real-time WebSocket communication across staff clients (KDS, POS, Dispatcher, CRM).
 * Note: WsAuthGuard / JWT handshake middleware attaches here for system-wide Auth/RBAC.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    const rawBranchId = (client.handshake.query.branchId as string) || '';
    let branchId = rawBranchId;

    if (rawBranchId) {
      // Validate branch existence in database
      const branchExists = await this.prisma.branch.findUnique({ where: { id: rawBranchId } });
      if (!branchExists) {
        this.logger.warn(`Client ${client.id} provided invalid branchId "${rawBranchId}". Falling back to default.`);
        branchId = 'default-branch';
      }
    } else {
      const defaultBranch = await this.prisma.branch.findFirst();
      branchId = defaultBranch ? defaultBranch.id : 'default-branch';
    }

    const roomName = `branch_${branchId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} connected to WebSocket room "${roomName}"`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected from WebSocket gateway.`);
  }

  @SubscribeMessage('joinBranch')
  async handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    if (data && data.branchId) {
      const branchExists = await this.prisma.branch.findUnique({ where: { id: data.branchId } });
      if (!branchExists) {
        return { status: 'ERROR', message: `Branch "${data.branchId}" not found` };
      }

      const roomName = `branch_${data.branchId}`;
      client.join(roomName);
      this.logger.log(`Client ${client.id} joined room ${roomName}`);
      return { status: 'JOINED', room: roomName };
    }
  }

  // --- Broadcast Helper Methods ---

  emitOrderCreated(branchId: string, order: any) {
    const roomName = `branch_${branchId || 'default-branch'}`;
    this.server.to(roomName).emit('order.created', order);
    this.logger.log(`WS Event "order.created" emitted to room ${roomName} for Order ${order.id}`);
  }

  emitOrderStatusChanged(branchId: string, orderId: string, status: string, order: any) {
    const roomName = `branch_${branchId || 'default-branch'}`;
    this.server.to(roomName).emit('order.status_changed', { orderId, status, order });
    this.logger.log(`WS Event "order.status_changed" emitted to room ${roomName}: Order ${orderId} -> ${status}`);
  }

  emitStopListChanged(branchId: string, payload: any) {
    const roomName = `branch_${branchId || 'default-branch'}`;
    this.server.to(roomName).emit('stoplist.changed', payload);
    this.logger.log(`WS Event "stoplist.changed" emitted to room ${roomName}`);
  }

  emitWaiterCalled(branchId: string, payload: { tableId?: string; tableLabel: string; time: string }) {
    const roomName = `branch_${branchId || 'default-branch'}`;
    this.server.to(roomName).emit('waiter.called', payload);
    this.logger.log(`WS Event "waiter.called" emitted to room ${roomName}: ${payload.tableLabel}`);
  }

  emitDeliveryAssigned(branchId: string, order: any) {
    const roomName = `branch_${branchId || 'default-branch'}`;
    this.server.to(roomName).emit('delivery.assigned', order);
    this.logger.log(`WS Event "delivery.assigned" emitted to room ${roomName} for Order ${order.id}`);
  }

  emitDeliveryStatusChanged(branchId: string, payload: { orderId: string; deliveryStatus: string; order: any }) {
    const roomName = `branch_${branchId || 'default-branch'}`;
    this.server.to(roomName).emit('delivery.status_changed', payload);
    this.logger.log(`WS Event "delivery.status_changed" emitted to room ${roomName}: Order ${payload.orderId} -> ${payload.deliveryStatus}`);
  }
}
