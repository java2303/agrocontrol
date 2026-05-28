// Debe ser la primera línea del archivo
require('dotenv').config(); 
console.log('Valor detectado de DB_PASSWORD:', process.env.DB_PASSWORD ? 'Cargado' : 'No encontrado');
const express = require('express');
const cors = require('cors');
// ... resto de tus imports
const { Pool } = require('pg');
const path = require('path');
// Forzamos la carga del .env especificando la ruta exacta
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD || ''), // Forzamos que sea String
    port: process.env.DB_PORT,
});

// Validación rápida de carga de variables (solo para desarrollo)
if (!process.env.DB_PASSWORD) {
    console.error('ALERTA: La variable DB_PASSWORD no se cargó correctamente desde el .env');
}

pool.on('connect', () => {
    console.log('Conexión establecida con el pool de PostgreSQL');
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};