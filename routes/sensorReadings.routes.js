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
    // Verificar que el sensor existe y pertenece al usuario
    const sensor = await Sensor.findOne({
      where: { id: sensor_id },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id }
      }]
    });

    if (!sensor) {
      return res.status(404).json({ 
        message: 'Sensor no encontrado o no pertenece al usuario' 
      });
    }

    const reading = await SensorReading.create({
      sensor_id,
      value
    });

    res.status(201).json(reading);
  } catch (error) {
    console.error('❌ Error creando lectura:', error);
    res.status(400).json({ 
      message: 'Error creando lectura de sensor', 
      error: error.message 
    });
  }
});

// Obtener todas las lecturas del usuario
router.get('/', protect, async (req, res) => {
  try {
    console.log('🔒 Usuario autenticado:', req.user.id);
    
    // PASO 1: Obtener devices del usuario
    const userDevices = await Device.findAll({
      where: { user_id: req.user.id },
      attributes: ['id']
    });
    
    if (userDevices.length === 0) {
      console.log('⚠️ Usuario sin devices');
      return res.json([]);
    }
    
    // PASO 2: Obtener sensores de esos devices
    const deviceIds = userDevices.map(device => device.id);
    const userSensors = await Sensor.findAll({
      where: { device_id: deviceIds },
      attributes: ['id']
    });
    
    if (userSensors.length === 0) {
      console.log('⚠️ Usuario sin sensores');
      return res.json([]);
    }
    
    // PASO 3: Obtener lecturas de esos sensores
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
        attributes: ['id', 'name', 'type', 'unit', 'threshold']
      }],
      order: [['created_at', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    });
    
    res.json(readings);
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error obteniendo lecturas', 
      error: error.message 
    });
  }
});

// Obtener lecturas por sensor específico
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
      return res.status(404).json({ 
        message: 'Sensor no encontrado o no pertenece al usuario' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: readings } = await SensorReading.findAndCountAll({
      where: { sensor_id: req.params.sensorId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      readings,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo lecturas del sensor:', error);
    res.status(500).json({ 
      message: 'Error obteniendo lecturas del sensor', 
      error: error.message 
    });
  }
});

// Obtener lecturas por rango de fechas
router.get('/sensor/:sensorId/range', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Fechas de inicio y fin son requeridas' 
      });
    }

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
      return res.status(404).json({ 
        message: 'Sensor no encontrado o no pertenece al usuario' 
      });
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
    console.error('❌ Error obteniendo lecturas por rango:', error);
    res.status(500).json({ 
      message: 'Error obteniendo lecturas por rango de fechas', 
      error: error.message 
    });
  }
});

// Obtener últimas N lecturas de un sensor
router.get('/sensor/:sensorId/latest', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

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
      return res.status(404).json({ 
        message: 'Sensor no encontrado o no pertenece al usuario' 
      });
    }

    const readings = await SensorReading.findAll({
      where: { sensor_id: req.params.sensorId },
      order: [['created_at', 'DESC']],
      limit
    });

    res.json(readings);
  } catch (error) {
    console.error('❌ Error obteniendo últimas lecturas:', error);
    res.status(500).json({ 
      message: 'Error obteniendo últimas lecturas', 
      error: error.message 
    });
  }
});

// Obtener estadísticas de un sensor
router.get('/sensor/:sensorId/stats', protect, async (req, res) => {
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
      return res.status(404).json({ 
        message: 'Sensor no encontrado o no pertenece al usuario' 
      });
    }

    const readings = await SensorReading.findAll({
      where: { sensor_id: req.params.sensorId },
      attributes: ['value'],
      order: [['created_at', 'DESC']]
    });

    if (readings.length === 0) {
      return res.json({
        total_readings: 0,
        avg_value: null,
        min_value: null,
        max_value: null,
        latest_value: null
      });
    }

    const values = readings.map(r => r.value);
    const stats = {
      total_readings: readings.length,
      avg_value: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
      min_value: Math.min(...values),
      max_value: Math.max(...values),
      latest_value: values[0]
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      message: 'Error obteniendo estadísticas del sensor', 
      error: error.message 
    });
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
    console.error('❌ Error obteniendo lectura:', error);
    res.status(500).json({ 
      message: 'Error obteniendo lectura', 
      error: error.message 
    });
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
    console.error('❌ Error eliminando lectura:', error);
    res.status(500).json({ 
      message: 'Error eliminando lectura', 
      error: error.message 
    });
  }
});

// Eliminar todas las lecturas de un sensor
router.delete('/sensor/:sensorId/all', protect, async (req, res) => {
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
      return res.status(404).json({ 
        message: 'Sensor no encontrado o no pertenece al usuario' 
      });
    }

    const deletedCount = await SensorReading.destroy({
      where: { sensor_id: req.params.sensorId }
    });

    res.json({ 
      message: 'Lecturas eliminadas exitosamente',
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('❌ Error eliminando lecturas:', error);
    res.status(500).json({ 
      message: 'Error eliminando lecturas del sensor', 
      error: error.message 
    });
  }
});

module.exports = router;