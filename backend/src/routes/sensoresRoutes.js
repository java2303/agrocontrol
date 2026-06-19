const express = require('express');
const router = express.Router();
const sensoresController = require('../controllers/sensoresController');
const authMiddlware = require('../middlewares/authMiddlware');

router.get('/sensores', authMiddlware, sensoresController.obtenerLecturas);

module.exports = router;
