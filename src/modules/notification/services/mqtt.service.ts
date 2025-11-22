import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient;
  private readonly logger = new Logger(MqttService.name);
  private topicCallbacks: Map<string, Set<(topic: string, payload: Buffer) => void>> = new Map();

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
    }
  }

  private connect() {
    try {
      // Select broker URL - use Adafruit MQTT if configured, otherwise local
      const brokerUrl =
        process.env.MQTT_BROKER_URL ||
        (process.env.ADAFRUIT_USERNAME
          ? `mqtt://${process.env.ADAFRUIT_USERNAME}.mqtt.adafruit.io:1883`
          : 'mqtt://mqtt:1883');

      const clientId = `backend-${Date.now()}`;
      this.logger.log(`Connecting to MQTT broker: ${brokerUrl}`);

      const mqttOptions: Record<string, unknown> = {
        clientId,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
      };

      // Add credentials - use Adafruit credentials if available
      if (process.env.ADAFRUIT_USERNAME && process.env.ADAFRUIT_KEY) {
        (mqttOptions as Record<string, string>).username =
          process.env.ADAFRUIT_USERNAME;
        (mqttOptions as Record<string, string>).password =
          process.env.ADAFRUIT_KEY;
      } else if (process.env.MQTT_USERNAME) {
        (mqttOptions as Record<string, string>).username =
          process.env.MQTT_USERNAME;
      }
      if (process.env.MQTT_PASSWORD && !process.env.ADAFRUIT_KEY) {
        (mqttOptions as Record<string, string>).password =
          process.env.MQTT_PASSWORD;
      }

      this.client = mqtt.connect(brokerUrl, mqttOptions);

      this.client.on('connect', () => {
        this.logger.log('Connected to MQTT broker');
      });

      this.client.on('error', (error) => {
        this.logger.error('MQTT connection error:', error);
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
        this.logger.log(
          `📨 Message received on ${topic}: ${payload.toString()}`,
        );
        // Trigger registered callbacks
        const callbacks = this.topicCallbacks.get(topic);
        if (callbacks) {
          callbacks.forEach((callback) => {
            try {
              callback(topic, payload);
            } catch (error) {
              this.logger.error(`Error in topic callback for ${topic}:`, error);
            }
          });
        }
      });
    } catch (error) {
      this.logger.error('Failed to connect to MQTT broker:', error);
    }
  }

  subscribe(topic: string, callback?: (message: string) => void) {
    if (this.client && this.client.connected) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          this.logger.log(`Subscribed to topic: ${topic}`);
        }
      });

      if (callback) {
        this.client.on('message', (receivedTopic: string, payload: Buffer) => {
          if (receivedTopic === topic) {
            callback(payload.toString());
          }
        });
      }
    }
  }

  subscribeToTopic(
    topic: string,
    callback: (topic: string, message: Buffer) => void,
  ) {
    if (!this.topicCallbacks.has(topic)) {
      this.topicCallbacks.set(topic, new Set());
    }
    this.topicCallbacks.get(topic)!.add(callback);

    if (this.client && this.client.connected) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          this.logger.log(`Subscribed to topic: ${topic}`);
        }
      });
    } else {
      this.logger.warn(`MQTT not connected, callback registered for ${topic} but subscription will happen on connect`);
    }
  }

  private topicMatches(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length !== topicParts.length) {
      return false;
    }

    return patternParts.every((part, index) => {
      return part === '+' || part === topicParts[index];
    });
  }

  publish(topic: string, message: string | object, options = {}) {
    if (this.client && this.client.connected) {
      const payload =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.client.publish(topic, payload, options, (err) => {
        if (err) {
          this.logger.error(`Failed to publish to ${topic}:`, err);
        } else {
          this.logger.debug(`Published to ${topic}: ${payload}`);
        }
      });
    } else {
      this.logger.warn('MQTT client not connected');
    }
  }

  isConnected(): boolean {
    return this.client && this.client.connected;
  }
}
