/**
 * Pagination metadata type
 */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * API Response wrapper type
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
};

/**
 * Device status type
 */
export type DeviceStatus = 'online' | 'offline' | 'inactive';

/**
 * Sensor reading type
 */
export type SensorReading = {
  temperature?: number;
  humidity?: number;
  light?: number;
  [key: string]: any;
};
