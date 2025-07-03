const jwt = require('jsonwebtoken');
const User = require('../models/users');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      return next();
    } catch (error) {
      console.error('Error en verificación de token:', error);
      return res.status(401).json({ message: 'Token inválido' });
    }
  }

  return res.status(401).json({ message: 'Autenticación requerida' });
};


module.exports = { protect };