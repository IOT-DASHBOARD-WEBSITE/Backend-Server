import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeviceModule } from '@modules/device/device.module';
import { SensorModule } from '@modules/sensor/sensor.module';
import { ControlModule } from '@modules/control/control.module';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI ||
            'mongodb://admin:admin@localhost:27017/iot_db?authSource=admin'
        : process.env.MONGODB_URI_LOCAL ||
            'mongodb://admin:admin@localhost:27017/iot_db?authSource=admin',
      {
        retryAttempts: 5,
        retryDelay: 5000,
      },
    ),
    DeviceModule,
    SensorModule,
    ControlModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
