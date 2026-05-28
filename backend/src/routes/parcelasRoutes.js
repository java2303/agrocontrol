const express = require('express');
const router = express.Router();
const parcelasController = require('../controllers/parcelasController');
const authMiddlware = require('../middlewares/authMiddlware');

router.post('/', authMiddlware, parcelasController.crearParcela);
router.get('/', authMiddlware, parcelasController.obtenerParcelas);
router.put('/:id', authMiddlware, parcelasController.actualizarParcela);
router.delete('/:id', authMiddlware, parcelasController.eliminarParcela);

module.exports = router;