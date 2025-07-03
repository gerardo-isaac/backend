const express = require('express');
const router = express.Router();
const Alert = require('../models/alerts');
const SensorReading = require('../models/sensorReadings');
const Sensor = require('../models/sensors');
const Device = require('../models/devices');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper function para verificar ownership
const getUserReadingIds = async (userId) => {
  const devices = await Device.findAll({ where: { user_id: userId }, attributes: ['id'] });
  if (!devices.length) return [];
  
  const sensors = await Sensor.findAll({ 
    where: { device_id: devices.map(d => d.id) }, 
    attributes: ['id'] 
  });
  if (!sensors.length) return [];
  
  const readings = await SensorReading.findAll({ 
    where: { sensor_id: sensors.map(s => s.id) }, 
    attributes: ['id'] 
  });
  
  return readings.map(r => r.id);
};

// Crear alerta
router.post('/', protect, async (req, res) => {
  const { reading_id, type, status, message } = req.body;

  try {
    const reading = await SensorReading.findOne({
      where: { id: reading_id },
      include: [{
        model: Sensor,
        as: 'sensor',
        include: [{ model: Device, as: 'device', where: { user_id: req.user.id } }]
      }]
    });

    if (!reading) {
      return res.status(404).json({ message: 'Lectura no encontrada' });
    }

  const alert = await Alert.create({
    reading_id,
    device_id: reading.sensor.device_id, 
    type,
    status: status || 'activa',
    message,
    notified_at: new Date()
  });

    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: 'Error creando alerta', error: error.message });
  }
});

// Obtener alertas del usuario
router.get('/', protect, async (req, res) => {
  try {
    const readingIds = await getUserReadingIds(req.user.id);
    if (!readingIds.length) return res.json([]);

    const alerts = await Alert.findAll({
      where: { reading_id: readingIds },
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
      order: [['id', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo alertas', error: error.message });
  }
});

// Obtener alerta específica
router.get('/:id', protect, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: { id: req.params.id },
      include: [{
        model: SensorReading,
        as: 'reading',
        include: [{
          model: Sensor,
          as: 'sensor',
          include: [{ model: Device, as: 'device', where: { user_id: req.user.id } }]
        }]
      }]
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo alerta', error: error.message });
  }
});

// Actualizar alerta
router.put('/:id', protect, async (req, res) => {
  const { type, status, message } = req.body;

  try {
    const readingIds = await getUserReadingIds(req.user.id);
    const alert = await Alert.findOne({ where: { id: req.params.id, reading_id: readingIds } });

    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    const updateData = { type, status, message };
    if (status === 'resuelta' || status === 'falsa_alarma') {
      updateData.resolved_at = new Date();
    }

    await alert.update(updateData);
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando alerta', error: error.message });
  }
});

// Resolver alerta
router.patch('/:id/resolve', protect, async (req, res) => {
  const { status } = req.body;

  if (!['resuelta', 'falsa_alarma'].includes(status)) {
    return res.status(400).json({ message: 'Estado debe ser "resuelta" o "falsa_alarma"' });
  }

  try {
    const readingIds = await getUserReadingIds(req.user.id);
    const alert = await Alert.findOne({ where: { id: req.params.id, reading_id: readingIds } });

    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    await alert.update({ status, resolved_at: new Date() });
    res.json({ message: `Alerta ${status}`, alert });
  } catch (error) {
    res.status(500).json({ message: 'Error resolviendo alerta', error: error.message });
  }
});

// Eliminar alerta
router.delete('/:id', protect, async (req, res) => {
  try {
    const readingIds = await getUserReadingIds(req.user.id);
    const alert = await Alert.findOne({ where: { id: req.params.id, reading_id: readingIds } });

    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    await alert.destroy();
    res.json({ message: 'Alerta eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando alerta', error: error.message });
  }
});

module.exports = router;