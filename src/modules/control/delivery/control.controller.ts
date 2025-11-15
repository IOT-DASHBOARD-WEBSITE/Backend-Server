import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ControlService } from '../services/control.service';
import {
  WiFiConfigDto,
  DeviceIdConfigDto,
  IntervalConfigDto,
  RebootDeviceDto,
} from './request/control.request.dto';

@Controller('api/control')
export class ControlController {
  constructor(private controlService: ControlService) {}

  @Post('wifi')
  @HttpCode(HttpStatus.OK)
  async configureWiFi(@Body() wifiConfigDto: WiFiConfigDto) {
    return this.controlService.configureWiFi(wifiConfigDto);
  }

  @Post('device-id')
  @HttpCode(HttpStatus.OK)
  async updateDeviceId(@Body() deviceIdConfigDto: DeviceIdConfigDto) {
    return this.controlService.updateDeviceId(deviceIdConfigDto);
  }

  @Post('interval')
  @HttpCode(HttpStatus.OK)
  async setInterval(@Body() intervalConfigDto: IntervalConfigDto) {
    return this.controlService.setDataInterval(intervalConfigDto);
  }

  @Post('reboot')
  @HttpCode(HttpStatus.OK)
  reboot(@Body() rebootDeviceDto: RebootDeviceDto) {
    return this.controlService.rebootDevice(rebootDeviceDto);
  }
}
