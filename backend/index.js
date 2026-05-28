require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const parcelasRoutes = require('./src/routes/parcelasRoutes');
const cultivosRoutes = require('./src/routes/cultivosRoutes');
const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/parcelas', parcelasRoutes);
app.use('/api', cultivosRoutes);

// --- Ruta de Prueba de Conexión ---
app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'success',
            message: 'Conexión con PostgreSQL exitosa',
            server_time: result.rows[0].now
        });
    } catch (err) {
        console.error('Error al conectar con la BD:', err);
        res.status(500).json({
            status: 'error',
            message: 'No se pudo conectar con la base de datos'
        });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor de Agro Control corriendo en puerto ${PORT}`);
});