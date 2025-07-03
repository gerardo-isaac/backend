const express = require('express');
const router = express.Router();
const Notification = require('../models/notifications');
const Alert = require('../models/alerts');
const SensorReading = require('../models/sensorReadings');
const Sensor = require('../models/sensors');
const Device = require('../models/devices');
const { protect } = require('../middleware/auth');

// Helper function para verificar ownership de la alerta
const verifyAlertOwnership = async (alertId, userId) => {
  const alert = await Alert.findOne({
    where: { id: alertId },
    include: [{
      model: SensorReading,
      as: 'reading',
      include: [{
        model: Sensor,
        as: 'sensor',
        include: [{ model: Device, as: 'device', where: { user_id: userId } }]
      }]
    }]
  });
  return alert;
};

// Crear notificación
router.post('/', protect, async (req, res) => {
  const { alert_id, channel, status } = req.body;

  try {
    const alert = await verifyAlertOwnership(alert_id, req.user.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    const notification = await Notification.create({
      alert_id,
      user_id: req.user.id,
      channel,
      status: status || 'enviada',
      sent_at: new Date()
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: 'Error creando notificación', error: error.message });
  }
});

// Obtener notificaciones del usuario
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Alert,
        as: 'alert',
        include: [{
          model: SensorReading,
          as: 'reading',
          include: [{
            model: Sensor,
            as: 'sensor',
            include: [{ model: Device, as: 'device', attributes: ['id', 'name'] }],
            attributes: ['id', 'name', 'type']
          }],
          attributes: ['id', 'value', 'created_at']
        }],
        attributes: ['id', 'type', 'message', 'status']
      }],
      order: [['id', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo notificaciones', error: error.message });
  }
});

// Obtener notificación específica
router.get('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{
        model: Alert,
        as: 'alert',
        include: [{
          model: SensorReading,
          as: 'reading',
          include: [{
            model: Sensor,
            as: 'sensor',
            include: [{ model: Device, as: 'device' }]
          }]
        }]
      }]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo notificación', error: error.message });
  }
});

// Actualizar notificación
router.put('/:id', protect, async (req, res) => {
  const { channel, status } = req.body;

  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await notification.update({ channel, status });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando notificación', error: error.message });
  }
});

// Marcar como leída
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await notification.update({ status: 'leída' });
    res.json({ message: 'Notificación marcada como leída', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error marcando notificación', error: error.message });
  }
});

// Eliminar notificación
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await notification.destroy();
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando notificación', error: error.message });
  }
});

module.exports = router;