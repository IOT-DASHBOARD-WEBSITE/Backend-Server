import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SensorData, SensorDataSchema } from './infras/entities/sensor.entity';
import { SensorController } from './delivery/sensor.controller';
import { SensorService } from './services/sensor.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SensorData.name, schema: SensorDataSchema },
    ]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [SensorController],
  providers: [SensorService],
  exports: [SensorService],
})
export class SensorModule {}
