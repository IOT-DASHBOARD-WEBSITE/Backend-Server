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
      // Select broker URL based on NODE_ENV
      const brokerUrl =
        process.env.NODE_ENV === 'production'
          ? process.env.MQTT_BROKER_URL ||
            'mqtts://your-cluster.hivemq.cloud:8883'
          : process.env.MQTT_BROKER_URL_LOCAL || 'mqtt://localhost:1883';

      const clientId = `backend-${Date.now()}`;
      this.logger.log(`Connecting to MQTT broker: ${brokerUrl}`);

      const mqttOptions: Record<string, unknown> = {
        clientId,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
      };

      // Add credentials if provided
      if (process.env.MQTT_USERNAME) {
        (mqttOptions as Record<string, string>).username =
          process.env.MQTT_USERNAME;
      }
      if (process.env.MQTT_PASSWORD) {
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
        this.logger.debug(
          `Message received on ${topic}: ${payload.toString()}`,
        );
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
    if (this.client && this.client.connected) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          this.logger.log(`Subscribed to topic: ${topic}`);
        }
      });

      this.client.on('message', (receivedTopic: string, payload: Buffer) => {
        if (this.topicMatches(topic, receivedTopic)) {
          callback(receivedTopic, payload);
        }
      });
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
