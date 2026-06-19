const db = require('../config/db');

/**
 * 🗺️ Registra una nueva parcela desde el mapa satelital
 */
const crearParcela = async (req, res) => {
    try {
        const { usuario_id, nombre, ubicacion_nombre, tipo_cultivo_id, area_hectareas, geometria } = req.body;

        // 1. ⚙️ Validar regla de negocio del CIAT (Máximo 50 hectáreas)
        if (parseFloat(area_hectareas) > 50.00) {
            return res.status(400).json({
                status: 'error',
                message: 'Regla del CIAT: La superficie de la parcela no puede exceder las 50 hectáreas.'
            });
        }

        // 2. 🗄️ Insertar en PostgreSQL transformando el GeoJSON a geometría de PostGIS
        const queryText = `
            INSERT INTO parcelas (usuario_id, nombre, ubicacion_nombre, tipo_cultivo_id, area_hectareas, geom)
            VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
            RETURNING parcela_id, nombre, area_hectareas;
        `;

        // Convertimos el objeto de geometría del mapa a texto para ST_GeomFromGeoJSON
        const geometriaStr = JSON.stringify(geometria);

        const values = [
            usuario_id, 
            nombre, 
            ubicacion_nombre, 
            tipo_cultivo_id, 
            area_hectareas, 
            geometriaStr
        ];

        const result = await db.query(queryText, values);

        // 3. 🎉 Respuesta exitosa
        res.status(201).json({
            status: 'success',
            message: 'Parcela registrada exitosamente para trazabilidad.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar la parcela:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al procesar el trazado geográfico.'
        });
    }
};
const obtenerParcelas = async (req, res) => {
    try {
        // Extraemos el ID del usuario que el authMiddleware inyectó en la petición
        const usuario_id = req.usuario.id;

        const queryText = `
            SELECT 
                parcela_id AS id, 
                nombre, 
                ubicacion_nombre, 
                tipo_cultivo_id AS "cropType", 
                area_hectareas AS area,
                fecha_creacion AS "createdAt",
                ST_AsGeoJSON(geom) AS geom
            FROM parcelas
            WHERE usuario_id = $1
            ORDER BY nombre ASC;
        `;

        const result = await db.query(queryText, [usuario_id]);

        res.status(200).json({
            status: 'success',
            data: result.rows
        });

    } catch (error) {
        console.error('Error al obtener las parcelas:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al cargar la lista de parcelas.'
        });
    }
};
const actualizarParcela = async (req, res) => {
    try {
        const parcela_id = req.params.id;
        const usuario_id = req.usuario.id;
        const { name, cropType } = req.body;

        // El frontend nos envía textos ('soya', 'maiz'), pero la BD usa IDs (1, 2, 3).
        // Hacemos una conversión rápida:
        let tipo_cultivo_id = 4; // 'otros' por defecto
        if (cropType === 'soya') tipo_cultivo_id = 1;
        if (cropType === 'maiz') tipo_cultivo_id = 2;
        if (cropType === 'trigo') tipo_cultivo_id = 3;

        const queryText = `
            UPDATE parcelas 
            SET nombre = $1, tipo_cultivo_id = $2
            WHERE parcela_id = $3 AND usuario_id = $4
            RETURNING parcela_id, nombre;
        `;

        const result = await db.query(queryText, [name, tipo_cultivo_id, parcela_id, usuario_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Parcela no encontrada o sin permisos.' });
        }

        res.status(200).json({ status: 'success', message: 'Parcela actualizada.', data: result.rows[0] });

    } catch (error) {
        console.error('Error al actualizar parcela:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor al actualizar.' });
    }
};

/**
 * 🗑️ Elimina una parcela de la base de datos
 */
const eliminarParcela = async (req, res) => {
    try {
        const parcela_id = req.params.id;
        const usuario_id = req.usuario.id;

        const queryText = `
            DELETE FROM parcelas 
            WHERE parcela_id = $1 AND usuario_id = $2
            RETURNING parcela_id;
        `;

        const result = await db.query(queryText, [parcela_id, usuario_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Parcela no encontrada o sin permisos.' });
        }

        res.status(200).json({ status: 'success', message: 'Parcela eliminada exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar parcela:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor al eliminar.' });
    }
};

module.exports = {
    crearParcela,
    obtenerParcelas,
    actualizarParcela,
    eliminarParcela
};