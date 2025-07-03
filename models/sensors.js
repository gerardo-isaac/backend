const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Device = require('./devices');

const Sensor = sequelize.define('Sensor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Device,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('gas', 'temperatura', 'magnetico'),
    allowNull: false,
    validate: {
      isIn: [['gas', 'temperatura', 'magnetico']]
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  unit: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [0, 10]
    }
  },
  threshold: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      isFloat: true
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sensors',
  timestamps: false
});

// Asociaciones bien definidas
// Sensor.belongsTo(Device, { 
//   foreignKey: 'device_id',
//   as: 'device'
// });

// Device.hasMany(Sensor, { 
//   foreignKey: 'device_id',
//   as: 'sensors'
// });

module.exports = Sensor;