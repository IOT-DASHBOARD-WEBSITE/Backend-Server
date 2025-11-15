import { Injectable } from '@nestjs/common';
import { MqttGateway } from '../delivery/mqtt-gateway.gateway';

@Injectable()
export class NotificationService {
  constructor(private mqttGateway: MqttGateway) {}

  emitDeviceUpdate(deviceId: string, updateData: any): void {
    this.mqttGateway.emitDeviceUpdate(deviceId, updateData);
  }

  emitSensorUpdate(deviceId: string, sensorData: any): void {
    this.mqttGateway.emitSensorUpdate(deviceId, sensorData);
  }
}
