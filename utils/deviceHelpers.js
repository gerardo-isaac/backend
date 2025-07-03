const Sensor = require('../models/sensors');

const createDefaultSensors = async (deviceId, options = {}) => {
  console.log('🔄 createDefaultSensors - deviceId:', deviceId);

  const sensors = [
    { name: 'Temperatura', type: 'temperatura', unit: '°C', threshold: 35.0, device_id: deviceId },
    { name: 'Gas', type: 'gas', unit: 'PPM', threshold: 50.0, device_id: deviceId },
    { name: 'Magnético', type: 'magnetico', unit: 'boolean', threshold: 1.0, device_id: deviceId }
  ];

  console.log('📊 Sensors a crear:', sensors);

  try {
    const result = await Sensor.bulkCreate(sensors, options); 
    console.log('✅ Sensores creados exitosamente:', result.length);
    return result;
  } catch (error) {
    console.error('❌ Error en bulkCreate:', error);
    throw error;
  }
};

const getSensorByType = async (deviceId, type) => {
  return await Sensor.findOne({ where: { device_id: deviceId, type } });
};

const getSensorsStructured = async (deviceId) => {
  const sensors = await Sensor.findAll({ where: { device_id: deviceId } });
  return {
    temperature: sensors.find(s => s.type === 'temperatura') || null,
    gas: sensors.find(s => s.type === 'gas') || null,
    magnetic: sensors.find(s => s.type === 'magnetico') || null
  };
};

module.exports = { createDefaultSensors, getSensorByType, getSensorsStructured };