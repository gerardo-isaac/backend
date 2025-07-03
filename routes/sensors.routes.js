const express = require('express');
const router = express.Router();
const SensorReading = require('../models/sensorReadings');
const Sensor = require('../models/sensors');
const Device = require('../models/devices');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

// Crear una nueva lectura de sensor
router.post('/', protect, async (req, res) => {
  const { sensor_id, value } = req.body;

  try {
    // Verificar que el sensor pertenece al usuario
    const sensor = await Sensor.findOne({
      where: { id: sensor_id },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id }
      }]
    });

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor no encontrado' });
    }

    const reading = await SensorReading.create({
      sensor_id,
      value
    });

    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({ message: 'Error creando lectura', error: error.message });
  }
});

// Obtener todas las lecturas del usuario
router.get('/', protect, async (req, res) => {
  try {
    // Obtener devices del usuario
    const userDevices = await Device.findAll({
      where: { user_id: req.user.id },
      attributes: ['id']
    });
    
    if (userDevices.length === 0) {
      return res.json([]);
    }
    
    // Obtener sensores de esos devices
    const deviceIds = userDevices.map(device => device.id);
    const userSensors = await Sensor.findAll({
      where: { device_id: deviceIds },
      attributes: ['id']
    });
    
    if (userSensors.length === 0) {
      return res.json([]);
    }
    
    // Obtener lecturas con información del sensor y device
    const sensorIds = userSensors.map(sensor => sensor.id);
    const readings = await SensorReading.findAll({
      where: { sensor_id: sensorIds },
      include: [{
        model: Sensor,
        as: 'sensor',
        include: [{
          model: Device,
          as: 'device',
          attributes: ['id', 'name']
        }],
        attributes: ['id', 'name', 'type', 'unit']
      }],
      order: [['created_at', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    });
    
    res.json(readings);
    
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo lecturas', error: error.message });
  }
});

// Obtener lecturas de un sensor específico
router.get('/sensor/:sensorId', protect, async (req, res) => {
  try {
    // Verificar que el sensor pertenece al usuario
    const sensor = await Sensor.findOne({
      where: { id: req.params.sensorId },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id }
      }]
    });

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor no encontrado' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const readings = await SensorReading.findAll({
      where: { sensor_id: req.params.sensorId },
      order: [['created_at', 'DESC']],
      limit
    });

    res.json(readings);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo lecturas del sensor', error: error.message });
  }
});

// Obtener lecturas por rango de fechas
router.get('/sensor/:sensorId/range', protect, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Fechas de inicio y fin son requeridas' });
  }

  try {
    // Verificar que el sensor pertenece al usuario
    const sensor = await Sensor.findOne({
      where: { id: req.params.sensorId },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id }
      }]
    });

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor no encontrado' });
    }

    const readings = await SensorReading.findAll({
      where: { 
        sensor_id: req.params.sensorId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      order: [['created_at', 'ASC']]
    });

    res.json(readings);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo lecturas por rango', error: error.message });
  }
});

// Obtener una lectura específica
router.get('/:id', protect, async (req, res) => {
  try {
    const reading = await SensorReading.findOne({
      where: { id: req.params.id },
      include: [{
        model: Sensor,
        as: 'sensor',
        include: [{
          model: Device,
          as: 'device',
          where: { user_id: req.user.id }
        }]
      }]
    });

    if (!reading) {
      return res.status(404).json({ message: 'Lectura no encontrada' });
    }

    res.json(reading);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo lectura', error: error.message });
  }
});

// Eliminar una lectura específica
router.delete('/:id', protect, async (req, res) => {
  try {
    const reading = await SensorReading.findOne({
      where: { id: req.params.id },
      include: [{
        model: Sensor,
        as: 'sensor',
        include: [{
          model: Device,
          as: 'device',
          where: { user_id: req.user.id }
        }]
      }]
    });

    if (!reading) {
      return res.status(404).json({ message: 'Lectura no encontrada' });
    }

    await reading.destroy();
    res.json({ message: 'Lectura eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando lectura', error: error.message });
  }
});

module.exports = router;