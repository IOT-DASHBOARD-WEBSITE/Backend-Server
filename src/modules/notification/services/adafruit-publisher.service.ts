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
      await this.httpClient.post(`${feedUrl}/data`, {
        value,
      });

      this.logger.debug(`Published data to ${feedUrl}: ${value}`);
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
