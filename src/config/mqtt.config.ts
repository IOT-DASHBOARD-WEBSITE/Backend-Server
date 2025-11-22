export const getMqttConfig = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mqtt:1883';

  return {
    brokerUrl,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `backend-${Date.now()}`,
  };
};
