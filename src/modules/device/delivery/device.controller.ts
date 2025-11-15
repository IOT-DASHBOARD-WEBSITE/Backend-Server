import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeviceService } from '../services/device.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from './request/create-device.request.dto';
import { DeviceDto } from './response/device.response.dto';

@Controller('api/devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ items: DeviceDto[]; total: number }> {
    return this.deviceService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DeviceDto> {
    return this.deviceService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDeviceDto: CreateDeviceDto): Promise<DeviceDto> {
    return this.deviceService.create(createDeviceDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceDto> {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.deviceService.remove(id);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const device = await this.deviceService.findOne(id);
    return {
      id: device.id,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen,
    };
  }
}
