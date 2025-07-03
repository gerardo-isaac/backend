const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Sensor = require('./sensors');

const SensorReading = sequelize.define('SensorReading', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sensor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Sensor,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: true,
      notNull: {
        msg: 'El valor de la lectura es requerido'
      }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sensor_readings',
  timestamps: false
});

module.exports = SensorReading;