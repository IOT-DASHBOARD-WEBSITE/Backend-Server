import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Adafruit IO Configuration Service
 * Manages connections and API endpoints for Adafruit IO
 */
@Injectable()
export class AdafruitConfigService {
  readonly username: string;
  readonly key: string;
  readonly useSsl: boolean;

  readonly feeds = {
    // Publisher feeds (send data to Adafruit)
    temperature: '',
    humidity: '',
    light: '',

    // Subscriber feeds (receive data from Adafruit)
    wifiSsid: '',
    wifiPassword: '',
    sendInterval: '',
  };

  constructor(private configService: ConfigService) {
    this.username = this.configService.get<string>('ADAFRUIT_USERNAME') || '';
    this.key = this.configService.get<string>('ADAFRUIT_KEY') || '';
    this.useSsl = this.configService.get<string>('ADAFRUIT_USE_SSL') === 'true';

    // Initialize feed APIs
    this.feeds.temperature =
      this.configService.get<string>('ADAFRUIT_TEMPERATURE_FEED') || '';
    this.feeds.humidity =
      this.configService.get<string>('ADAFRUIT_HUMIDITY_FEED') || '';
    this.feeds.light =
      this.configService.get<string>('ADAFRUIT_LIGHT_FEED') || '';

    this.feeds.wifiSsid =
      this.configService.get<string>('ADAFRUIT_WIFI_SSID_FEED') || '';
    this.feeds.wifiPassword =
      this.configService.get<string>('ADAFRUIT_WIFI_PASSWORD_FEED') || '';
    this.feeds.sendInterval =
      this.configService.get<string>('ADAFRUIT_SEND_INTERVAL_FEED') || '';
  }

  /**
   * Get MQTT connection options for Adafruit IO
   */
  getMqttOptions() {
    return {
      protocol: this.useSsl ? 'mqtts' : 'mqtt',
      host: `${this.username}.mqtt.adafruit.io`,
      port: this.useSsl ? 8883 : 1883,
      username: this.username,
      password: this.key,
      clientId: `${this.username}-${Date.now()}`,
      reconnectPeriod: 5000,
      clean: true,
    };
  }

  /**
   * Get HTTP headers for REST API calls to Adafruit
   */
  getHttpHeaders() {
    return {
      'X-AIO-Key': this.key,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Verify Adafruit configuration is complete
   */
  isConfigured(): boolean {
    return (
      !!this.username &&
      !!this.key &&
      !!this.feeds.temperature &&
      !!this.feeds.humidity &&
      !!this.feeds.light &&
      !!this.feeds.wifiSsid &&
      !!this.feeds.wifiPassword &&
      !!this.feeds.sendInterval
    );
  }
}
