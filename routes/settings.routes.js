const express = require('express');
const router = express.Router();
const Setting = require('../models/settings');
const Device = require('../models/devices');
const { protect } = require('../middleware/auth');

// Middleware para verificar ownership del dispositivo
const verifyDeviceOwnership = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.body.device_id;
    const device = await Device.findOne({
      where: { id: deviceId, user_id: req.user.id }
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }
    
    req.device = device;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verificando dispositivo', error: error.message });
  }
};

// Crear configuración para un dispositivo
router.post('/', protect, verifyDeviceOwnership, async (req, res) => {
  try {
    // Verificar si ya existe configuración
    const existing = await Setting.findOne({ where: { device_id: req.body.device_id } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe configuración para este dispositivo' });
    }

    const setting = await Setting.create(req.body);
    res.status(201).json(setting);
  } catch (error) {
    res.status(400).json({ message: 'Error creando configuración', error: error.message });
  }
});

// Obtener todas las configuraciones del usuario
router.get('/', protect, async (req, res) => {
  try {
    const settings = await Setting.findAll({
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id },
        attributes: ['id', 'name']
      }],
      order: [['id', 'ASC']]
    });
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo configuraciones', error: error.message });
  }
});

// Obtener configuración por ID
router.get('/:id', protect, async (req, res) => {
  try {
    const setting = await Setting.findOne({
      where: { id: req.params.id },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo configuración', error: error.message });
  }
});

// Obtener configuración por device_id
router.get('/device/:deviceId', protect, verifyDeviceOwnership, async (req, res) => {
  try {
    const setting = await Setting.findOne({
      where: { device_id: req.params.deviceId },
      include: [{
        model: Device,
        as: 'device',
        attributes: ['id', 'name']
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo configuración', error: error.message });
  }
});

// Actualizar configuración por ID
router.put('/:id', protect, async (req, res) => {
  try {
    const setting = await Setting.findOne({
      where: { id: req.params.id },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id }
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    await setting.update(req.body);
    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando configuración', error: error.message });
  }
});

// Actualizar configuración por device_id
router.put('/device/:deviceId', protect, verifyDeviceOwnership, async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { device_id: req.params.deviceId } });
    
    if (!setting) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    await setting.update(req.body);
    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando configuración', error: error.message });
  }
});

// Eliminar configuración por ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const setting = await Setting.findOne({
      where: { id: req.params.id },
      include: [{
        model: Device,
        as: 'device',
        where: { user_id: req.user.id }
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    await setting.destroy();
    res.json({ message: 'Configuración eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando configuración', error: error.message });
  }
});

// Eliminar configuración por device_id
router.delete('/device/:deviceId', protect, verifyDeviceOwnership, async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { device_id: req.params.deviceId } });
    
    if (!setting) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    await setting.destroy();
    res.json({ message: 'Configuración eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando configuración', error: error.message });
  }
});

module.exports = router;