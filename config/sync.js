const sequelize = require('./db');

// Importar todos los modelos
const User = require('../models/users');
const Device = require('../models/devices');
const Sensor = require('../models/sensors');
const SensorReading = require('../models/sensorReadings');
const Alert = require('../models/alerts');
const Notification = require('../models/notifications');
const Settings   = require('../models/settings');

// Definir Relaciones entre los modelos
const defineAssociations = () => {
  // User -> Device
  User.hasMany(Device, { foreignKey: 'user_id', as: 'devices' });
  Device.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Device -> Sensor
  Device.hasMany(Sensor, { foreignKey: 'device_id', as: 'sensors', onDelete: 'CASCADE' });
  Sensor.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

  // Sensor -> SensorReading
  SensorReading.belongsTo(Sensor, { foreignKey: 'sensor_id', as: 'sensor' });
  Sensor.hasMany(SensorReading, { foreignKey: 'sensor_id', as: 'readings' });

  // Device -> Alert
  Device.hasMany(Alert, { foreignKey: 'device_id', as: 'alerts', onDelete: 'CASCADE' });
  Alert.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

  // SensorReading -> Alert
  SensorReading.hasMany(Alert, { foreignKey: 'reading_id', as: 'alerts', onDelete: 'CASCADE' });
  Alert.belongsTo(SensorReading, { foreignKey: 'reading_id', as: 'reading' });

  // Alert -> Notification
  Alert.hasMany(Notification, { foreignKey: 'alert_id', as: 'notifications', onDelete: 'CASCADE' });
  Notification.belongsTo(Alert, { foreignKey: 'alert_id', as: 'alert' });

  // Device -> Settings
  Device.hasMany(Settings, { foreignKey: 'device_id', as: 'settings', onDelete: 'CASCADE' });
  Settings.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
};

// Función para sincronizar todas las tablas
const syncDatabase = async () => {
  try {
    defineAssociations();
    
    // Luego sincronizar la base de datos
    await sequelize.sync({ force: false });
    console.log('✅ Base de datos sincronizada correctamente');
  } catch (error) {
    console.error('❌ Error sincronizando base de datos:', error);
  }
};

module.exports = syncDatabase;