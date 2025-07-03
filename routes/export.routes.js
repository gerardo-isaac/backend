const express = require('express');

const router = express.Router();

// Importar la ruta de cada modulo
const authRoutes = require('./auth.routes');
const userRoutes = require('./users.routes');
const deviceRoutes = require('./devices.routes');
const sensorRoutes = require('./sensors.routes');
const sensorReadingRoutes = require('./sensorReadings.routes');
const alertRoutes = require('./alerts.routes');
const notificationRoutes = require('./notifications.routes');
const settingsRoutes = require('./settings.routes');

// Usar rutas importadas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/devices', deviceRoutes);
router.use('/sensors', sensorRoutes);
router.use('/sensors-readings', sensorReadingRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;