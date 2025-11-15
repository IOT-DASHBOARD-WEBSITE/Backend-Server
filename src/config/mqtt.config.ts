export const getMqttConfig = () => {
  const brokerUrl =
    process.env.NODE_ENV === 'development'
      ? process.env.MQTT_BROKER_URL_LOCAL || 'mqtt://localhost:1883'
      : process.env.MQTT_BROKER_URL || 'mqtt://mqtt:1883';

  return {
    brokerUrl,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `backend-${Date.now()}`,
  };
};
