import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SensorService } from '../services/sensor.service';
import { CreateSensorDataDto, QuerySensorDataDto } from './request';
import { SensorDataDto } from './response/sensor-data.response.dto';
import { AdafruitPublisherService } from '../../notification/services/adafruit-publisher.service';

@Controller('api/sensors')
export class SensorController {
  constructor(
    private sensorService: SensorService,
    private adafruitPublisher: AdafruitPublisherService,
  ) {}

  @Get()
  async findAll(
    @Query() query: QuerySensorDataDto,
  ): Promise<{ items: SensorDataDto[]; total: number }> {
    return this.sensorService.findAll(query);
  }

  @Get('latest/:deviceId')
  async getLatest(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit: number = 1,
  ): Promise<SensorDataDto[]> {
    return this.sensorService.findLatestByDeviceId(deviceId, limit);
  }

  @Get('statistics/:deviceId')
  async getStatistics(
    @Param('deviceId') deviceId: string,
    @Query('hours') hours: number = 24,
  ) {
    return this.sensorService.getStatistics(deviceId, hours);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSensorDataDto: CreateSensorDataDto,
  ): Promise<SensorDataDto> {
    const sensorData = await this.sensorService.create(createSensorDataDto);

    // Publish to Adafruit IO
    try {
      if (
        createSensorDataDto.temperature !== undefined &&
        createSensorDataDto.temperature !== null
      ) {
        await this.adafruitPublisher.publishTemperature(
          createSensorDataDto.temperature,
        );
      }

      if (
        createSensorDataDto.humidity !== undefined &&
        createSensorDataDto.humidity !== null
      ) {
        await this.adafruitPublisher.publishHumidity(
          createSensorDataDto.humidity,
        );
      }

      if (
        createSensorDataDto.light !== undefined &&
        createSensorDataDto.light !== null
      ) {
        await this.adafruitPublisher.publishLight(
          createSensorDataDto.light,
        );
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to publish to Adafruit:', error);
    }

    return sensorData;
  }
}
