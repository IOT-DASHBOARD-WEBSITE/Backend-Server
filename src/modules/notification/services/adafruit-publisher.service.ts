import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AdafruitConfigService } from '../config/adafruit.config';

/**
 * Service to publish sensor data to Adafruit IO
 */
@Injectable()
export class AdafruitPublisherService {
  private readonly logger = new Logger(AdafruitPublisherService.name);
  private httpClient: AxiosInstance;

  constructor(private adafruitConfig: AdafruitConfigService) {
    const headers = this.adafruitConfig.getHttpHeaders();
    this.httpClient = axios.create({
      headers,
      timeout: 5000,
    });
  }

  /**
   * Send temperature data to Adafruit IO
   */
  async publishTemperature(value: number): Promise<boolean> {
    return this.publishToFeed(
      this.adafruitConfig.feeds.temperature,
      value.toString(),
    );
  }

  /**
   * Send humidity data to Adafruit IO
   */
  async publishHumidity(value: number): Promise<boolean> {
    return this.publishToFeed(
      this.adafruitConfig.feeds.humidity,
      value.toString(),
    );
  }

  /**
   * Send light intensity data to Adafruit IO
   */
  async publishLight(value: number): Promise<boolean> {
    return this.publishToFeed(
      this.adafruitConfig.feeds.light,
      value.toString(),
    );
  }

  /**
   * Send WiFi SSID to Adafruit IO
   */
  async publishWifiSsid(value: string): Promise<boolean> {
    this.logger.log(`📤 Publishing WiFi SSID to Adafruit: ${value}`);
    const result = await this.publishToFeed(
      this.adafruitConfig.feeds.wifiSsid,
      value,
    );
    if (result) {
      this.logger.log(`✅ Successfully published WiFi SSID to Adafruit`);
    } else {
      this.logger.error(`❌ Failed to publish WiFi SSID to Adafruit`);
    }
    return result;
  }

  /**
   * Send WiFi Password to Adafruit IO
   */
  async publishWifiPassword(value: string): Promise<boolean> {
    this.logger.log(`📤 Publishing WiFi Password to Adafruit`);
    const result = await this.publishToFeed(
      this.adafruitConfig.feeds.wifiPassword,
      value,
    );
    if (result) {
      this.logger.log(`✅ Successfully published WiFi Password to Adafruit`);
    } else {
      this.logger.error(`❌ Failed to publish WiFi Password to Adafruit`);
    }
    return result;
  }

  /**
   * Send send interval (in seconds) to Adafruit IO
   */
  async publishSendInterval(value: number): Promise<boolean> {
    // Convert milliseconds to seconds for Adafruit
    const seconds = Math.floor(value / 1000);
    this.logger.log(`📤 Publishing sendInterval to Adafruit: ${seconds} seconds (${value}ms)`);
    const result = await this.publishToFeed(
      this.adafruitConfig.feeds.sendInterval,
      seconds.toString(),
    );
    if (result) {
      this.logger.log(`✅ Successfully published sendInterval: ${seconds}s to Adafruit`);
    } else {
      this.logger.error(`❌ Failed to publish sendInterval to Adafruit`);
    }
    return result;
  }

  /**
   * Generic method to publish data to any feed
   */
  private async publishToFeed(
    feedUrl: string,
    value: string,
  ): Promise<boolean> {
    if (!feedUrl) {
      this.logger.warn('Feed URL not configured');
      return false;
    }

    try {
      // Extract feed key from URL if it's a full URL
      // e.g., "https://io.adafruit.com/api/v2/quangppm/feeds/yolofarm.farm-send-interval"
      // -> "yolofarm.farm-send-interval"
      let cleanFeedKey = feedUrl;
      if (feedUrl.includes('/feeds/')) {
        const match = feedUrl.match(/\/feeds\/([^\/]+)/);
        if (match && match[1]) {
          cleanFeedKey = match[1];
        }
      }

      // Build proper URL
      const username = this.adafruitConfig.username;
      const url = `https://io.adafruit.com/api/v2/${username}/feeds/${cleanFeedKey}/data`;
      
      const response = await this.httpClient.post(url, {
        value,
      });

      this.logger.log(`✅ Published data to Adafruit feed ${cleanFeedKey}: ${value} (URL: ${url})`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to publish to Adafruit: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get latest value from a feed
   */
  async getLatestFeedValue(feedUrl: string): Promise<string | null> {
    if (!feedUrl) {
      this.logger.warn('Feed URL not configured');
      return null;
    }

    try {
      const response = await this.httpClient.get(`${feedUrl}/data?limit=1`);

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        return response.data[0].value;
      }

      return null;
    } catch {
      this.logger.error('Failed to get feed value from Adafruit');
      return null;
    }
  }

  /**
   * Check if Adafruit IO is configured and reachable
   */
  async healthCheck(): Promise<boolean> {
    if (!this.adafruitConfig.isConfigured()) {
      this.logger.warn('Adafruit IO is not properly configured');
      return false;
    }

    try {
      // Try to get the first configured feed
      const feedUrl = this.adafruitConfig.feeds.temperature;
      await this.httpClient.get(`${feedUrl}/data?limit=1`);
      this.logger.log('Adafruit IO health check: OK');
      return true;
    } catch {
      this.logger.error('Adafruit IO health check failed');
      return false;
    }
  }
}
