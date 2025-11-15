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
  pressure?: number;

  @IsDateString()
  timestamp: string;
}
