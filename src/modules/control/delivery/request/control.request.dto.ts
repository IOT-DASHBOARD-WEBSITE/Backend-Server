import { IsString, IsNumber, Min } from 'class-validator';

export class WiFiConfigDto {
  @IsString()
  deviceId: string;

  @IsString()
  ssid: string;

  @IsString()
  password: string;
}

export class DeviceIdConfigDto {
  @IsString()
  deviceId: string;

  @IsString()
  newDeviceId: string;
}

export class IntervalConfigDto {
  @IsString()
  deviceId: string;

  @IsNumber()
  @Min(1000)
  interval: number;
}

export class RebootDeviceDto {
  @IsString()
  deviceId: string;
}
