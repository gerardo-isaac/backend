const express = require('express');
const router = express.Router();
const User = require('../models/users');

// Registro
router.post('/register', async (req, res) => {
  const { name, email, password, phone_number } = req.body;
  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const user = await User.create({ name, email, password_hash: password, phone_number });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: require('../config/jwt')(user.id)
    });
  } catch (error) {
    res.status(400).json({ message: 'Error en registro', error: error.message });
  }
});

module.exports = router;
