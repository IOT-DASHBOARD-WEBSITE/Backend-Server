import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttGateway } from './delivery/mqtt-gateway.gateway';
import { AdafruitController } from './delivery/adafruit.controller';
import { MqttService } from './services/mqtt.service';
import { AdafruitMapperService } from './services/adafruit-mapper.service';
import { AdafruitPublisherService } from './services/adafruit-publisher.service';
import { AdafruitSubscriberService } from './services/adafruit-subscriber.service';
import { AdafruitFetcherService } from './services/adafruit-fetcher.service';
import { NotificationService } from './services/notification.service';
import { AdafruitConfigService } from './config/adafruit.config';
import { SensorModule } from '../sensor/sensor.module';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => SensorModule),
    forwardRef(() => DeviceModule),
  ],
  controllers: [AdafruitController],
  providers: [
    AdafruitConfigService,
    MqttGateway,
    MqttService,
    AdafruitMapperService,
    AdafruitPublisherService,
    AdafruitSubscriberService,
    AdafruitFetcherService,
    NotificationService,
  ],
  exports: [
    AdafruitConfigService,
    MqttGateway,
    MqttService,
    AdafruitMapperService,
    AdafruitPublisherService,
    AdafruitSubscriberService,
    AdafruitFetcherService,
    NotificationService,
  ],
})
export class NotificationModule {}
