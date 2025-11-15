import { Injectable, Logger } from '@nestjs/common';
import { ParsedAdafruitMessage, ParseError } from '../../../common/interfaces';

@Injectable()
export class AdafruitMapperService {
  private readonly logger = new Logger(AdafruitMapperService.name);

  /**
   * Parse Adafruit IO MQTT message
   * Format: {username}/feeds/{feed_name} = {value}
   * Example: john/feeds/device-status = {"status": "online"}
   */
  parseAdafruitMessage(
    topic: string,
    payload: Buffer,
  ): ParsedAdafruitMessage | null {
    try {
      const parts = topic.split('/');

      // Expected format: username/feeds/feed-name
      if (parts.length < 3 || parts[1] !== 'feeds') {
        this.logger.warn(`Invalid Adafruit topic format: ${topic}`);
        return null;
      }

      const username = parts[0];
      const feedName = parts[2];
      const value = payload.toString();

      const parsedMessage: ParsedAdafruitMessage = {
        username,
        feedName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: this.parseValue(value),
        timestamp: new Date(),
      };
      return parsedMessage;
    } catch (error) {
      const parseError = error as ParseError;
      const errorMessage = parseError?.message || 'Unknown error';
      this.logger.error(`Failed to parse Adafruit message: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Parse the actual data value
   * Can be: number, JSON string, boolean text, plain string
   */
  private parseValue(value: string): any {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Try to parse as number
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num;
      }

      // Try to parse as boolean
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;

      // Return as string
      return value;
    }
  }

  /**
   * Map Adafruit feed name to your internal device ID
   * Customize this mapping based on your feed naming convention
   */
  mapFeedToDeviceId(feedName: string): string | null {
    // Example mappings - update based on your actual feeds
    const feedMapping: { [key: string]: string } = {
      'device-status': 'device-status',
      'device-temperature': 'temperature-sensor',
      'device-humidity': 'humidity-sensor',
      'device-control': 'control-device',
      'device-config': 'config-device',
    };

    return feedMapping[feedName] || null;
  }

  /**
   * Map Adafruit feed name to sensor type
   * Used to categorize incoming data
   */
  mapFeedToSensorType(
    feedName: string,
  ): 'status' | 'temperature' | 'humidity' | 'control' | 'config' | null {
    const typeMapping: {
      [key: string]:
        | 'status'
        | 'temperature'
        | 'humidity'
        | 'control'
        | 'config';
    } = {
      'device-status': 'status',
      'device-temperature': 'temperature',
      'device-humidity': 'humidity',
      'device-control': 'control',
      'device-config': 'config',
    };

    return typeMapping[feedName] || null;
  }

  /**
   * Build Adafruit feed name from device/sensor info
   * Reverse mapping - used when publishing to Adafruit
   */
  buildAdafruitFeedName(deviceId: string, sensorType: string): string {
    return `${deviceId}-${sensorType}`.toLowerCase().replace(/_/g, '-');
  }

  /**
   * Build full Adafruit MQTT topic from username and feed
   */
  buildAdafruitTopic(username: string, feedName: string): string {
    return `${username}/feeds/${feedName}`;
  }

  /**
   * Format data for publishing to Adafruit IO
   */

  formatForAdafruit(data: any): string {
    if (
      typeof data === 'string' ||
      typeof data === 'number' ||
      typeof data === 'boolean'
    ) {
      return data.toString();
    }
    return JSON.stringify(data);
  }

  /**
   * Check if a topic is an Adafruit IO feed topic
   */
  isAdafruitTopic(topic: string): boolean {
    return topic.includes('/feeds/');
  }

  /**
   * Extract username from Adafruit IO topic
   */
  getAdafruitUsername(topic: string): string | null {
    const parts = topic.split('/');
    return parts.length > 0 ? parts[0] : null;
  }

  /**
   * Extract feed name from Adafruit IO topic
   */
  getAdafruitFeedName(topic: string): string | null {
    const parts = topic.split('/');
    return parts.length > 2 ? parts[2] : null;
  }
}
