const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reading_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sensor_readings',
      key: 'id'
    }
  },
  device_id: { 
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50)
  },
  status: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['activa', 'resuelta', 'falsa_alarma']]
    }
  },
  message: {
    type: DataTypes.TEXT
  },
  notified_at: {
    type: DataTypes.DATE
  },
  resolved_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'alerts',
  timestamps: false
});

module.exports = Alert;