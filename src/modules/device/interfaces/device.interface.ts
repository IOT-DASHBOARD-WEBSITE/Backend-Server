/**
 * Device interface definition
 * Defines the contract for device operations
 */
export interface IDevice {
  id?: string;
  deviceId: string;
  name: string;
  description?: string;
  wifiSSID?: string;
  wifiPassword?: string;
  dataInterval: number;
  lastSeen?: Date;
  isOnline?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
