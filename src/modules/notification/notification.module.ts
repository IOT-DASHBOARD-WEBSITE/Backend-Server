import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttGateway } from './delivery/mqtt-gateway.gateway';
import { AdafruitController } from './delivery/adafruit.controller';
import { MqttService } from './services/mqtt.service';
import { AdafruitMapperService } from './services/adafruit-mapper.service';
import { AdafruitPublisherService } from './services/adafruit-publisher.service';
import { NotificationService } from './services/notification.service';
import { AdafruitConfigService } from './config/adafruit.config';

@Module({
  imports: [ConfigModule],
  controllers: [AdafruitController],
  providers: [
    AdafruitConfigService,
    MqttGateway,
    MqttService,
    AdafruitMapperService,
    AdafruitPublisherService,
    NotificationService,
  ],
  exports: [
    AdafruitConfigService,
    MqttGateway,
    MqttService,
    AdafruitMapperService,
    AdafruitPublisherService,
    NotificationService,
  ],
})
export class NotificationModule {}
