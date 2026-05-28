const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el registro de nuevos usuarios (agronomos, productores o admin_ciat)
router.post('/registrar', authController.registrarUsuario);
router.post('/login', authController.login);
module.exports = router;