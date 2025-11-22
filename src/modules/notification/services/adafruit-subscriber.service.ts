import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { AdafruitConfigService } from '../config/adafruit.config';
import { AdafruitMapperService } from './adafruit-mapper.service';
import { SensorService } from '../../sensor/services/sensor.service';
import { DeviceService } from '../../device/services/device.service';
import { NotificationService } from './notification.service';

/**
 * Service to subscribe to Adafruit IO feeds and save sensor data to database
 */
@Injectable()
export class AdafruitSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(AdafruitSubscriberService.name);
  private readonly feedToSensorMap: Map<string, string> = new Map();
  private readonly deviceIdCache: Map<string, string> = new Map();
  // Temporary cache to store sensor values before creating a record
  private readonly sensorValueCache: Map<string, { temperature?: number; humidity?: number; light?: number; timestamp: Date }> = new Map();

  constructor(
    private mqttService: MqttService,
    private adafruitConfig: AdafruitConfigService,
    private adafruitMapper: AdafruitMapperService,
    private sensorService: SensorService,
    private deviceService: DeviceService,
    private notificationService: NotificationService,
  ) {
    // Map feed names to sensor types
    this.feedToSensorMap.set('yolofarm.farm-temperature', 'temperature');
    this.feedToSensorMap.set('yolofarm.farm-humidity', 'humidity');
    this.feedToSensorMap.set('yolofarm.farm-light-intensity', 'light');
  }

  async onModuleInit() {
    // Wait for MQTT connection, retry if not connected
    const trySubscribe = () => {
      if (this.mqttService.isConnected()) {
        this.subscribeToAdafruitFeeds();
      } else {
        this.logger.warn('MQTT not connected yet, retrying in 2 seconds...');
        setTimeout(trySubscribe, 2000);
      }
    };

    // Start trying after 3 seconds
    setTimeout(trySubscribe, 3000);
  }

  /**
   * Subscribe to all Adafruit feeds for sensor data
   */
  private subscribeToAdafruitFeeds() {
    if (!this.mqttService.isConnected()) {
      this.logger.warn('MQTT not connected, retrying subscription in 5 seconds...');
      setTimeout(() => this.subscribeToAdafruitFeeds(), 5000);
      return;
    }

    const username = this.adafruitConfig.username;
    if (!username) {
      this.logger.error('Adafruit username not configured');
      return;
    }

    this.logger.log(`Subscribing to Adafruit feeds for user: ${username}`);

    // Subscribe to temperature feed
    const tempTopic = `${username}/feeds/yolofarm.farm-temperature`;
    this.mqttService.subscribeToTopic(tempTopic, (topic, message) => {
      this.logger.debug(`Received message on ${topic}: ${message.toString()}`);
      this.handleAdafruitMessage(topic, message, 'temperature');
    });
    this.logger.log(`✅ Subscribed to Adafruit feed: ${tempTopic}`);

    // Subscribe to humidity feed
    const humidityTopic = `${username}/feeds/yolofarm.farm-humidity`;
    this.mqttService.subscribeToTopic(humidityTopic, (topic, message) => {
      this.logger.debug(`Received message on ${topic}: ${message.toString()}`);
      this.handleAdafruitMessage(topic, message, 'humidity');
    });
    this.logger.log(`✅ Subscribed to Adafruit feed: ${humidityTopic}`);

    // Subscribe to light feed
    const lightTopic = `${username}/feeds/yolofarm.farm-light-intensity`;
    this.mqttService.subscribeToTopic(lightTopic, (topic, message) => {
      this.logger.debug(`Received message on ${topic}: ${message.toString()}`);
      this.handleAdafruitMessage(topic, message, 'light');
    });
    this.logger.log(`✅ Subscribed to Adafruit feed: ${lightTopic}`);
  }

  /**
   * Handle incoming Adafruit MQTT message
   */
  private async handleAdafruitMessage(
    topic: string,
    message: Buffer,
    sensorType: 'temperature' | 'humidity' | 'light',
  ) {
    try {
      const parsed = this.adafruitMapper.parseAdafruitMessage(topic, message);
      if (!parsed) {
        this.logger.warn(`Failed to parse message from topic: ${topic}`);
        return;
      }

      const value = typeof parsed.value === 'number' ? parsed.value : parseFloat(parsed.value);
      if (isNaN(value)) {
        this.logger.warn(`Invalid numeric value from topic: ${topic}, value: ${parsed.value}`);
        return;
      }

      // Get device ID (default to first device or use a default device ID)
      const deviceId = await this.getDefaultDeviceId();

      // Get or create cache entry for this device
      const now = new Date();
      let cache = this.sensorValueCache.get(deviceId);
      
      // If cache is older than 10 seconds, create new one
      if (!cache || now.getTime() - cache.timestamp.getTime() > 10000) {
        // Get latest sensor data to populate cache
        const latestData = await this.sensorService.findLatestByDeviceId(deviceId, 1);
        const latest = latestData && latestData.length > 0 ? latestData[0] : null;
        
        cache = {
          temperature: latest?.temperature,
          humidity: latest?.humidity,
          light: latest?.light,
          timestamp: now,
        };
      }

      // Update cache with new value
      if (sensorType === 'temperature') {
        cache.temperature = value;
      } else if (sensorType === 'humidity') {
        cache.humidity = value;
      } else if (sensorType === 'light') {
        cache.light = value;
      }
      cache.timestamp = now;
      this.sensorValueCache.set(deviceId, cache);

      // Only create record if we have both required fields (temperature and humidity)
      if (cache.temperature !== undefined && cache.humidity !== undefined) {
        const sensorData = await this.sensorService.create({
          deviceId,
          temperature: cache.temperature,
          humidity: cache.humidity,
          light: cache.light,
          timestamp: now.toISOString(),
        });

        this.logger.debug(
          `Saved sensor data: temp=${cache.temperature}, humidity=${cache.humidity}, light=${cache.light} for device: ${deviceId}`,
        );

        // Emit WebSocket event for real-time updates
        this.notificationService.emitSensorUpdate(deviceId, {
          deviceId,
          temperature: cache.temperature,
          humidity: cache.humidity,
          light: cache.light,
          timestamp: now.toISOString(),
        });

        // Update device lastSeen and isOnline status
        await this.deviceService.updateDeviceStatus(deviceId, true);

        // Emit device status update
        this.notificationService.emitDeviceUpdate(deviceId, {
          deviceId,
          isOnline: true,
          lastSeen: now.toISOString(),
        });

        // Clear cache after successful save
        this.sensorValueCache.delete(deviceId);
      } else {
        this.logger.debug(
          `Cached ${sensorType} data: ${value} for device: ${deviceId} (waiting for other values)`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling Adafruit message: ${errorMessage}`, error);
    }
  }

  /**
   * Get or create device ID from Adafruit data
   * Creates a new device if it doesn't exist
   */
  private async getDefaultDeviceId(): Promise<string> {
    // Check cache first
    if (this.deviceIdCache.has('default')) {
      return this.deviceIdCache.get('default')!;
    }

    try {
      // Try to find existing device first
      const devices = await this.deviceService.findAll(1, 1);
      if (devices && devices.items && devices.items.length > 0) {
        const deviceId = devices.items[0].deviceId;
        this.deviceIdCache.set('default', deviceId);
        return deviceId;
      }

      // If no device exists, create a new one from Adafruit configuration
      const defaultDeviceId = 'yolofarm-device-001';
      try {
        const newDevice = await this.deviceService.create({
          deviceId: defaultDeviceId,
          name: 'YoloFarm Device',
          description: 'IoT device for YoloFarm - Auto-created from Adafruit data',
          wifiSSID: 'ACLAB',
          wifiPassword: 'ACLAB2023',
          dataInterval: 15000,
        });
        
        this.logger.log(`Created new device from Adafruit: ${defaultDeviceId}`);
        this.deviceIdCache.set('default', defaultDeviceId);
        return defaultDeviceId;
      } catch (createError) {
        // Device might already exist, try to find it
        const existingDevice = await this.deviceService.findByDeviceId(defaultDeviceId);
        if (existingDevice) {
          this.deviceIdCache.set('default', defaultDeviceId);
          return defaultDeviceId;
        }
        throw createError;
      }
    } catch (error) {
      this.logger.error('Error getting/creating device ID:', error);
      return 'yolofarm-device-001';
    }
  }
}

