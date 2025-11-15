import { Injectable } from '@nestjs/common';
import { DeviceService } from '../../device/services/device.service';
import { NotificationService } from '../../notification/services/notification.service';
import {
  WiFiConfigDto,
  DeviceIdConfigDto,
  IntervalConfigDto,
  RebootDeviceDto,
} from '../delivery/request/control.request.dto';

@Injectable()
export class ControlService {
  constructor(
    private deviceService: DeviceService,
    private notificationService: NotificationService,
  ) {}

  async configureWiFi(wifiConfigDto: WiFiConfigDto) {
    const { deviceId, ssid, password } = wifiConfigDto;

    // Update device in database
    const device = await this.deviceService.findByDeviceId(deviceId);
    if (device) {
      await this.deviceService.update(device.id, {
        wifiSSID: ssid,
        wifiPassword: password,
      });

      // Emit WebSocket update to subscribed clients
      this.notificationService.emitDeviceUpdate(deviceId, {
        wifiSSID: ssid,
        timestamp: new Date(),
      });
    }

    return {
      success: true,
      message: 'WiFi configuration command sent to device',
      deviceId,
    };
  }

  async updateDeviceId(deviceIdConfigDto: DeviceIdConfigDto) {
    const { deviceId, newDeviceId } = deviceIdConfigDto;

    const device = await this.deviceService.findByDeviceId(deviceId);
    if (device) {
      // Emit WebSocket update
      this.notificationService.emitDeviceUpdate(deviceId, {
        deviceId: newDeviceId,
        timestamp: new Date(),
      });
    }

    return {
      success: true,
      message: 'Device ID configuration command sent to device',
      deviceId,
      newDeviceId,
    };
  }

  async setDataInterval(intervalConfigDto: IntervalConfigDto) {
    const { deviceId, interval } = intervalConfigDto;

    const device = await this.deviceService.findByDeviceId(deviceId);
    if (device) {
      await this.deviceService.update(device.id, {
        dataInterval: interval,
      });

      // Emit WebSocket update
      this.notificationService.emitDeviceUpdate(deviceId, {
        dataInterval: interval,
        timestamp: new Date(),
      });
    }

    return {
      success: true,
      message: 'Data interval configuration command sent to device',
      deviceId,
      interval,
    };
  }

  rebootDevice(rebootDeviceDto: RebootDeviceDto) {
    const { deviceId } = rebootDeviceDto;

    // Emit WebSocket update
    this.notificationService.emitDeviceUpdate(deviceId, {
      status: 'rebooting',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Reboot command sent to device',
      deviceId,
    };
  }
}
