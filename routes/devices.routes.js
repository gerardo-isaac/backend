const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const Device = require('../models/devices');
const Sensor = require('../models/sensors');
const SensorReading = require('../models/sensorReadings');
const { protect } = require('../middleware/auth');
const { createDefaultSensors, getSensorsStructured } = require('../utils/deviceHelpers');

// Crear un nuevo device
router.post('/', protect, async (req, res) => {  
  let transaction;
  try {
    transaction = await sequelize.transaction(); 
    const { name } = req.body;
    const crypto = require('crypto');
    const apiKey = crypto.randomBytes(32).toString('hex');

    console.log('🔄 Creando device...');
    const device = await Device.create({
      name,
      user_id: req.user.id,
      api_key: apiKey
    }, { transaction });
    console.log('✅ Device creado:', device.id);

    // Crear sensores predefinidos
    console.log('🔄 Creando sensores predefinidos...');
    const sensors = await createDefaultSensors(device.id, { transaction });
    await transaction.commit();
    console.log('✅ Sensores creados:', sensors.length);

    res.status(201).json({
      id: device.id,
      name: device.name,
      user_id: device.user_id,
      api_key: device.api_key,
      created_at: device.created_at,
      sensors_created: sensors.length
    });
  } catch (error) {
    if (transaction) await transaction.rollback();    
    console.error('❌ Error:', error);
    res.status(400).json({ message: 'Error creando device', error: error.message });
  }
});

// ENDPOINT PARA SENSORES CON LECTURAS
router.get('/:deviceId/sensors-with-readings', protect, async (req, res) => {
  try {
    const device = await Device.findOne({
      where: { 
        id: req.params.deviceId,
        user_id: req.user.id 
      },
      include: [{
        model: Sensor,
        as: 'sensors',
        include: [{
          model: SensorReading,
          as: 'readings',
          limit: 5,
          order: [['created_at', 'DESC']]
        }]
      }]
    });

    if (!device) return res.status(404).json({ message: 'Device no encontrado' });
    
    res.json({
      deviceId: device.id,
      sensors: device.sensors.map(sensor => ({
        id: sensor.id,
        type: sensor.type,
        lastReadings: sensor.readings
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo sensores', error: error.message });
  }
});

// Obtener sensores estructurados de un device
router.get('/:deviceId/sensors-structured', protect, async (req, res) => {
  try {
    const device = await Device.findOne({
      where: { 
        id: req.params.deviceId,
        user_id: req.user.id 
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Device no encontrado' });
    }

    const sensors = await getSensorsStructured(req.params.deviceId);
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo sensores', error: error.message });
  }
});

router.get('/:deviceId/sensors', protect, async (req, res) => {
  try {
    // Verificar que el device pertenece al usuario
    const device = await Device.findOne({
      where: { 
        id: req.params.deviceId,
        user_id: req.user.id 
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Device no encontrado' });
    }

    // Obtener todos los sensores del device
    const sensors = await Sensor.findAll({
      where: { device_id: req.params.deviceId },
      order: [['created_at', 'ASC']]
    });

    res.json(sensors);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo sensores', error: error.message });
  }
});

// Obtener todos los devices del usuario autenticado
router.get('/', protect, async (req, res) => {
  try {
    const devices = await Device.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo devices', error: error.message });
  }
});

// Obtener un device específico del usuario
router.get('/:id', protect, async (req, res) => {
  try {
    const device = await Device.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Device no encontrado' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo device', error: error.message });
  }
});

// Actualizar un device
router.put('/:id', protect, async (req, res) => {
  const { name } = req.body;

  try {
    const [updatedRowsCount] = await Device.update(
      { name },
      {
        where: { 
          id: req.params.id,
          user_id: req.user.id 
        }
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Device no encontrado' });
    }

    const updatedDevice = await Device.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando device', error: error.message });
  }
});

// Eliminar un device
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedRowsCount = await Device.destroy({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Device no encontrado' });
    }

    res.json({ message: 'Device eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando device', error: error.message });
  }
});

// Regenerar API key de un device
router.put('/:id/regenerate-key', protect, async (req, res) => {
  const crypto = require('crypto');
  
  try {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    const [updatedRowsCount] = await Device.update(
      { api_key: newApiKey },
      {
        where: { 
          id: req.params.id,
          user_id: req.user.id 
        }
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Device no encontrado' });
    }

    const updatedDevice = await Device.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ message: 'Error regenerando API key', error: error.message });
  }
});

module.exports = router;