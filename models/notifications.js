const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alert_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'alerts',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channel: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['email', 'push', 'sms', 'call']]
    }
  },
  status: {
    type: DataTypes.STRING(20)
  },
  sent_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;