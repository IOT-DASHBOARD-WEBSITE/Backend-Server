import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SensorData,
  SensorDataDocument,
} from '../infras/entities/sensor.entity';
import { CreateSensorDataDto, QuerySensorDataDto } from '../delivery/request';
import { SensorDataDto } from '../delivery/response/sensor-data.response.dto';

@Injectable()
export class SensorService {
  constructor(
    @InjectModel(SensorData.name)
    private sensorDataModel: Model<SensorDataDocument>,
  ) {}

  async create(
    createSensorDataDto: CreateSensorDataDto,
  ): Promise<SensorDataDto> {
    const createdSensor = new this.sensorDataModel(createSensorDataDto);
    const saved = await createdSensor.save();
    return this.mapToDto(saved);
  }

  async findAll(
    query: QuerySensorDataDto,
  ): Promise<{ items: SensorDataDto[]; total: number }> {
    const { page = 1, limit = 10, deviceId, hours } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (deviceId) {
      filter.deviceId = deviceId;
    }
    if (hours) {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      filter.timestamp = { $gte: since };
    }

    const [data, total] = await Promise.all([
      this.sensorDataModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 })
        .exec(),
      this.sensorDataModel.countDocuments(filter),
    ]);

    return {
      items: data.map((item) => this.mapToDto(item)),
      total,
    };
  }

  async findLatestByDeviceId(
    deviceId: string,
    limit = 1,
  ): Promise<SensorDataDto[]> {
    const data = await this.sensorDataModel
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
    return data.map((item) => this.mapToDto(item));
  }

  async getStatistics(deviceId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await this.sensorDataModel
      .find({
        deviceId,
        timestamp: { $gte: since },
      })
      .exec();

    if (data.length === 0) {
      return null;
    }

    const temperatures = data.map((d) => d.temperature);
    const humidities = data.map((d) => d.humidity);

    return {
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      },
      dataPoints: data.length,
    };
  }

  private mapToDto(sensorData: SensorDataDocument): SensorDataDto {
    const mongoId = sensorData._id as { toString(): string };
    return {
      id: mongoId.toString(),
      deviceId: sensorData.deviceId,
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      pressure: sensorData.pressure,
      timestamp: sensorData.timestamp,
      createdAt: sensorData.createdAt,
    };
  }
}
