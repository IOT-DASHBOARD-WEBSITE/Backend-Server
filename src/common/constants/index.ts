/**
 * Device-related constants
 */
export const DEVICE_CONSTANTS = {
  DEFAULT_STATUS: 'offline',
  DEFAULT_INTERVAL: 5000,
  MIN_INTERVAL: 1000,
  MAX_INTERVAL: 60000,
};

/**
 * Sensor-related constants
 */
export const SENSOR_CONSTANTS = {
  DEFAULT_RETENTION_DAYS: 30,
  BATCH_SIZE: 100,
};

/**
 * MQTT-related constants
 */
export const MQTT_CONSTANTS = {
  RECONNECT_DELAY: 5000,
  RECONNECT_MAX_ATTEMPTS: 10,
  TOPIC_SEPARATOR: '/',
};

/**
 * Pagination constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  DEVICE_NOT_FOUND: 'Device not found',
  INVALID_DEVICE_ID: 'Invalid device ID',
  SENSOR_NOT_FOUND: 'Sensor data not found',
  OPERATION_FAILED: 'Operation failed',
};
