const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  notification_method: {
    type: DataTypes.STRING(20),
    defaultValue: 'email'
  },
  sms_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  call_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  repetition_delay: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'minutos'
  },
  max_open_time: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  gas_threshold: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  temperature_threshold: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'settings',
  timestamps: false
});

// Definir asociaciones
// Setting.associate = (models) => {
//   Setting.belongsTo(models.Device, {
//     foreignKey: 'device_id',
//     as: 'device'
//   });
// };

module.exports = Setting;