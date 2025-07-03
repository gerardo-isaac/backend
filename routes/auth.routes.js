const express = require('express');
const router = express.Router();
const User = require('../models/users');
const { protect } = require('../middleware/auth');
const generateToken = require('../config/jwt');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (user && (await user.validPassword(password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error: error.message });
  }
});

// Perfil protegido
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

// Logout (opcional, si estás manejando tokens en el cliente)
router.post('/logout', (req, res) => {
  // En APIs basadas en tokens (JWT), el logout generalmente se maneja en el cliente
  res.json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;
