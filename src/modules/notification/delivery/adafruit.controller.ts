import { Controller, Get, Logger } from '@nestjs/common';
import { AdafruitPublisherService } from '../services/adafruit-publisher.service';
import { AdafruitConfigService } from '../config/adafruit.config';

/**
 * Health check and status endpoints for Adafruit IO integration
 */
@Controller('api/adafruit')
export class AdafruitController {
  private readonly logger = new Logger(AdafruitController.name);

  constructor(
    private adafruitPublisher: AdafruitPublisherService,
    private adafruitConfig: AdafruitConfigService,
  ) {}

  /**
   * Check Adafruit IO connection status
   */
  @Get('health')
  async healthCheck() {
    const isConnected = await this.adafruitPublisher.healthCheck();
    const isConfigured = this.adafruitConfig.isConfigured();

    return {
      status: isConnected && isConfigured ? 'healthy' : 'unhealthy',
      configured: isConfigured,
      connected: isConnected,
      feeds: {
        temperature: !!this.adafruitConfig.feeds.temperature,
        humidity: !!this.adafruitConfig.feeds.humidity,
        light: !!this.adafruitConfig.feeds.light,
        wifiSsid: !!this.adafruitConfig.feeds.wifiSsid,
        wifiPassword: !!this.adafruitConfig.feeds.wifiPassword,
        sendInterval: !!this.adafruitConfig.feeds.sendInterval,
      },
    };
  }

  /**
   * Get Adafruit configuration status
   */
  @Get('config')
  getConfiguration() {
    return {
      username: this.adafruitConfig.username,
      hasKey: !!this.adafruitConfig.key,
      useSsl: this.adafruitConfig.useSsl,
      feeds: {
        temperature: this.adafruitConfig.feeds.temperature
          ? 'configured'
          : 'missing',
        humidity: this.adafruitConfig.feeds.humidity ? 'configured' : 'missing',
        light: this.adafruitConfig.feeds.light ? 'configured' : 'missing',
        wifiSsid: this.adafruitConfig.feeds.wifiSsid ? 'configured' : 'missing',
        wifiPassword: this.adafruitConfig.feeds.wifiPassword
          ? 'configured'
          : 'missing',
        sendInterval: this.adafruitConfig.feeds.sendInterval
          ? 'configured'
          : 'missing',
      },
    };
  }
}
