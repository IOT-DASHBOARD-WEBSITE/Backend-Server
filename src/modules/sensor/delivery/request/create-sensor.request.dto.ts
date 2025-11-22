import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateSensorDataDto {
  @IsString()
  deviceId: string;

  @IsNumber()
  temperature: number;

  @IsNumber()
  humidity: number;

  @IsOptional()
  @IsNumber()
  light?: number;

  @IsDateString()
  timestamp: string;
}
