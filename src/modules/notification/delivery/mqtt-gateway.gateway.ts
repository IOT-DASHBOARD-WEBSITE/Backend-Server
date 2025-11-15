import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { MqttService } from '../services/mqtt.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
})
@Injectable()
export class MqttGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  // Track device subscriptions: Map<deviceId, Set<socketId>>
  private deviceSubscriptions: Map<string, Set<string>> = new Map();

  // Track client subscriptions: Map<socketId, Set<deviceId>>
  private clientSubscriptions: Map<string, Set<string>> = new Map();

  constructor(private mqttService: MqttService) {}

  afterInit() {
    console.log('WebSocket Gateway initialized');

    // Subscribe to MQTT device status topics with wildcard
    this.mqttService.subscribeToTopic('device/+/status', (topic, message) => {
      const deviceId = this.extractDeviceId(topic);
      if (deviceId) {
        this.broadcastDeviceStatus(deviceId, message.toString());
      }
    });

    // Subscribe to MQTT sensor data topics with wildcard
    this.mqttService.subscribeToTopic('device/+/sensor', (topic, message) => {
      const deviceId = this.extractDeviceId(topic);
      if (deviceId) {
        this.broadcastSensorData(deviceId, message.toString());
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
    client.emit('connected', { message: 'Connected to WebSocket server' });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Clean up subscriptions when client disconnects
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.forEach((deviceId) => {
        const deviceSubs = this.deviceSubscriptions.get(deviceId);
        if (deviceSubs) {
          deviceSubs.delete(client.id);
          if (deviceSubs.size === 0) {
            this.deviceSubscriptions.delete(deviceId);
          }
        }
      });
    }
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe-device')
  handleSubscribeDevice(client: Socket, payload: { deviceId: string }): void {
    const { deviceId } = payload;
    console.log(`Client ${client.id} subscribing to device ${deviceId}`);

    // Add to client subscriptions
    let clientSubs = this.clientSubscriptions.get(client.id);
    if (!clientSubs) {
      clientSubs = new Set();
      this.clientSubscriptions.set(client.id, clientSubs);
    }
    clientSubs.add(deviceId);

    // Add to device subscriptions
    let deviceSubs = this.deviceSubscriptions.get(deviceId);
    if (!deviceSubs) {
      deviceSubs = new Set();
      this.deviceSubscriptions.set(deviceId, deviceSubs);
    }
    deviceSubs.add(client.id);

    client.emit('subscribed', { deviceId });
  }

  @SubscribeMessage('unsubscribe-device')
  handleUnsubscribeDevice(client: Socket, payload: { deviceId: string }): void {
    const { deviceId } = payload;
    console.log(`Client ${client.id} unsubscribing from device ${deviceId}`);

    // Remove from client subscriptions
    const clientSubs = this.clientSubscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.delete(deviceId);
    }

    // Remove from device subscriptions
    const deviceSubs = this.deviceSubscriptions.get(deviceId);
    if (deviceSubs) {
      deviceSubs.delete(client.id);
      if (deviceSubs.size === 0) {
        this.deviceSubscriptions.delete(deviceId);
      }
    }
  }

  /**
   * Broadcast device status to all subscribed clients
   */
  broadcastDeviceStatus(deviceId: string, statusData: string): void {
    const subscribers = this.deviceSubscriptions.get(deviceId);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('device-status', {
            deviceId,
            status: statusData,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  /**
   * Broadcast sensor data to all subscribed clients
   */
  broadcastSensorData(deviceId: string, sensorData: string): void {
    const subscribers = this.deviceSubscriptions.get(deviceId);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('sensor-data', {
            deviceId,
            data: sensorData,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  /**
   * Public method to emit device update (called from Control Service)
   */
  emitDeviceUpdate(deviceId: string, updateData: any): void {
    this.broadcastDeviceStatus(deviceId, JSON.stringify(updateData));
  }

  /**
   * Public method to emit sensor update (called from Sensor Service)
   */
  emitSensorUpdate(deviceId: string, sensorData: any): void {
    this.broadcastSensorData(deviceId, JSON.stringify(sensorData));
  }

  /**
   * Helper to extract deviceId from MQTT topic
   * Topics like: device/123/status -> 123
   */
  private extractDeviceId(topic: string): string | null {
    const parts = topic.split('/');
    if (parts.length >= 2 && parts[0] === 'device') {
      return parts[1];
    }
    return null;
  }
}
