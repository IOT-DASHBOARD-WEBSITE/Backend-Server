import { Module } from '@nestjs/common';
import { ControlController } from './delivery/control.controller';
import { ControlService } from './services/control.service';
import { DeviceModule } from '../device/device.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DeviceModule, NotificationModule],
  controllers: [ControlController],
  providers: [ControlService],
  exports: [ControlService],
})
export class ControlModule {}
