export interface SensorDataInterface {
  id: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  pressure?: number;
  timestamp: Date;
  createdAt: Date;
}
