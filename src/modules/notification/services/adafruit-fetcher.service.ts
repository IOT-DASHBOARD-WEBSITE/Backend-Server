import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import axios, { AxiosInstance } from 'axios';
import { AdafruitConfigService } from '../config/adafruit.config';
import { SensorService } from '../../sensor/services/sensor.service';
import { DeviceService } from '../../device/services/device.service';
import { NotificationService } from './notification.service';

/**
 * Service to fetch sensor data from Adafruit IO and save to database
 */
@Injectable()
export class AdafruitFetcherService implements OnModuleInit {
  private readonly logger = new Logger(AdafruitFetcherService.name);
  private deviceIntervals: Map<string, string> = new Map(); // deviceId -> cron job name
  private httpClient: AxiosInstance;

  constructor(
    private adafruitConfig: AdafruitConfigService,
    private sensorService: SensorService,
    @Inject(forwardRef(() => DeviceService))
    private deviceService: DeviceService,
    private notificationService: NotificationService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    const headers = this.adafruitConfig.getHttpHeaders();
    this.httpClient = axios.create({
      headers,
      timeout: 10000,
    });
  }

  async onModuleInit() {
    // Wait a bit for services to initialize
    this.logger.log('AdafruitFetcherService initialized, starting fetch in 3 seconds...');
    setTimeout(() => {
      this.startFetchingForAllDevices();
    }, 3000);
  }


  /**
   * Start fetching data for all devices based on their dataInterval
   */
  private async startFetchingForAllDevices() {
    try {
      this.logger.log('Starting to fetch data for all devices...');
      const devices = await this.deviceService.findAll(1, 100);
      if (devices && devices.items && devices.items.length > 0) {
        this.logger.log(`Found ${devices.items.length} device(s), starting fetch...`);
        devices.items.forEach((device) => {
          this.startFetchingForDevice(device.deviceId, device.dataInterval);
        });
        this.logger.log(`✅ Started fetching data for ${devices.items.length} device(s)`);
      } else {
        this.logger.warn('No devices found in database');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error starting fetch for devices: ${errorMessage}`, error);
    }
  }

  /**
   * Start fetching data for a specific device
   */
  startFetchingForDevice(deviceId: string, intervalMs: number) {
    // Stop existing job if any
    this.stopFetchingForDevice(deviceId);

    this.logger.log(`Starting fetch for device ${deviceId} with interval ${intervalMs}ms`);
    
    // Fetch immediately
    this.fetchDataFromAdafruit(deviceId).catch((error) => {
      this.logger.error(`Initial fetch failed for ${deviceId}:`, error);
    });

    // Create dynamic interval job
    const jobName = `fetch-${deviceId}`;
    
    const job = setInterval(() => {
      this.fetchDataFromAdafruit(deviceId).catch((error) => {
        this.logger.error(`Scheduled fetch failed for ${deviceId}:`, error);
      });
    }, intervalMs);

    this.schedulerRegistry.addInterval(jobName, job);
    this.deviceIntervals.set(deviceId, jobName);
    
    this.logger.log(
      `✅ Started fetching data for device ${deviceId} every ${intervalMs}ms (${intervalMs / 1000}s)`,
    );
  }

  /**
   * Stop fetching data for a specific device
   */
  stopFetchingForDevice(deviceId: string) {
    const jobName = this.deviceIntervals.get(deviceId);
    if (jobName) {
      try {
        const interval = this.schedulerRegistry.getInterval(jobName);
        if (interval) {
          clearInterval(interval);
          this.schedulerRegistry.deleteInterval(jobName);
        }
      } catch (error) {
        // Job might not exist
      }
      this.deviceIntervals.delete(deviceId);
      this.logger.log(`Stopped fetching data for device ${deviceId}`);
    }
  }

  /**
   * Fetch latest sensor data from Adafruit IO
   * Made public for testing purposes
   */
  async fetchDataFromAdafruit(deviceId: string) {
    if (!this.adafruitConfig.isConfigured()) {
      this.logger.warn('Adafruit not configured, skipping fetch');
      return;
    }

    this.logger.log(`🔄 Fetching data from Adafruit for device: ${deviceId}`);
    
    try {
      const username = this.adafruitConfig.username;
      const key = this.adafruitConfig.key;

      // Fetch temperature
      this.logger.debug(`Fetching temperature from feed: ${this.adafruitConfig.feeds.temperature}`);
      const tempValue = await this.fetchFeedValue(
        username,
        key,
        this.adafruitConfig.feeds.temperature,
      );
      this.logger.debug(`Temperature value: ${tempValue}`);

      // Fetch humidity
      this.logger.debug(`Fetching humidity from feed: ${this.adafruitConfig.feeds.humidity}`);
      const humidityValue = await this.fetchFeedValue(
        username,
        key,
        this.adafruitConfig.feeds.humidity,
      );
      this.logger.debug(`Humidity value: ${humidityValue}`);

      // Fetch light
      this.logger.debug(`Fetching light from feed: ${this.adafruitConfig.feeds.light}`);
      const lightValue = await this.fetchFeedValue(
        username,
        key,
        this.adafruitConfig.feeds.light,
      );
      this.logger.debug(`Light value: ${lightValue}`);

      // Only create record if we have temperature and humidity (required fields)
      if (tempValue !== null && humidityValue !== null) {
        await this.sensorService.create({
          deviceId,
          temperature: tempValue,
          humidity: humidityValue,
          light: lightValue !== null ? lightValue : undefined,
          timestamp: new Date().toISOString(),
        });

        // Update device status
        await this.deviceService.updateDeviceStatus(deviceId, true);

        // Emit WebSocket events
        this.notificationService.emitSensorUpdate(deviceId, {
          deviceId,
          temperature: tempValue,
          humidity: humidityValue,
          light: lightValue,
          timestamp: new Date().toISOString(),
        });

        this.notificationService.emitDeviceUpdate(deviceId, {
          deviceId,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });

        this.logger.log(
          `✅ Fetched and saved data for ${deviceId}: temp=${tempValue}, humidity=${humidityValue}, light=${lightValue}`,
        );
      } else {
        this.logger.warn(
          `⚠️ Missing required data for ${deviceId}: temp=${tempValue}, humidity=${humidityValue}, light=${lightValue}`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching data from Adafruit for ${deviceId}: ${errorMessage}`);
    }
  }

  /**
   * Fetch latest value from an Adafruit feed
   */
  private async fetchFeedValue(
    username: string,
    key: string,
    feedKey: string,
  ): Promise<number | null> {
    if (!feedKey) {
      this.logger.warn(`Feed key is empty, skipping fetch`);
      return null;
    }

    try {
      // Extract feed key from URL if it's a full URL
      // e.g., "https://io.adafruit.com/api/v2/quangppm/feeds/yolofarm.farm-temperature" 
      // -> "yolofarm.farm-temperature"
      let cleanFeedKey = feedKey;
      if (feedKey.includes('/feeds/')) {
        const match = feedKey.match(/\/feeds\/([^\/]+)/);
        if (match && match[1]) {
          cleanFeedKey = match[1];
        }
      }
      
      const url = `https://io.adafruit.com/api/v2/${username}/feeds/${cleanFeedKey}/data/last`;
      
      this.logger.debug(`Fetching from URL: ${url} (extracted from: ${feedKey})`);
      
      const response = await this.httpClient.get(url, {
        headers: {
          'X-AIO-Key': key,
        },
      });

      if (response.data && response.data.value) {
        const value = parseFloat(response.data.value);
        return isNaN(value) ? null : value;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to fetch feed ${feedKey}: ${error}`);
      return null;
    }
  }
}

