export interface SensorDataDto {
  id: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  light?: number;
  timestamp: Date;
  createdAt: Date;
}
