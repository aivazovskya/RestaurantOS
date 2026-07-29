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
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * EventsGateway
 * Manages real-time WebSocket communication across staff clients (KDS, POS, Dispatcher, CRM).
 * Auth & RBAC enforced on connection: requires valid JWT or guestQrSlug.
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const guestQrSlug = client.handshake.query?.guestQrSlug as string | undefined;

    if (guestQrSlug) {
      // Public Guest connection (e.g. GuestMenuView for stop-list/waiter updates)
      const table = await this.prisma.diningTable.findUnique({
        where: { qrSlug: guestQrSlug },
      });
      const branchId = table ? table.branchId : 'default-branch';
      const roomName = `branch_${branchId}`;
      client.join(roomName);
      this.logger.log(`Guest client ${client.id} connected via QR slug "${guestQrSlug}" to room ${roomName}`);
      return;
    }

    // Authenticated Staff/Courier Connection
    const token = (client.handshake.auth?.token || client.handshake.query?.token) as string | undefined;
    if (!token) {
      this.logger.warn(`WS Connection rejected for ${client.id}: No authentication token provided.`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      (client as any).user = payload;

      const requestedBranchId = (client.handshake.query?.branchId as string) || (payload.branchIds && payload.branchIds[0]);

      if (requestedBranchId && payload.role !== 'OWNER') {
        const hasAccess = payload.branchIds && payload.branchIds.includes(requestedBranchId);
        if (!hasAccess) {
          this.logger.warn(
            `WS Connection rejected for ${client.id}: User ${payload.sub} lacks access to branch "${requestedBranchId}"`,
          );
          client.disconnect();
          return;
        }
      }

      const activeBranchId = requestedBranchId || (payload.branchIds && payload.branchIds[0]) || 'default-branch';
      const roomName = `branch_${activeBranchId}`;
      client.join(roomName);
      this.logger.log(`Authenticated user ${payload.sub} (${payload.role}) connected to WS room "${roomName}"`);
    } catch (err: any) {
      this.logger.warn(`WS Connection rejected for ${client.id}: Invalid JWT token (${err.message}).`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected from WebSocket gateway.`);
  }

  @SubscribeMessage('joinBranch')
  async handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ) {
    const user = (client as any).user;
    if (data && data.branchId) {
      if (user && user.role !== 'OWNER' && user.branchIds && !user.branchIds.includes(data.branchId)) {
        return { status: 'ERROR', message: `Unauthorized access to branch "${data.branchId}"` };
      }

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
