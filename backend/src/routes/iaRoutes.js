const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const authMiddlware = require('../middlewares/authMiddlware');

router.get('/ia/recomendaciones', authMiddlware, iaController.obtenerRecomendaciones);
router.post('/ia/chat', authMiddlware, iaController.preguntarAsistente);

module.exports = router;
