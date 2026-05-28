const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    registrarUsuario: async (req, res) => {
        const { nombre_completo, email, password, telefono, ci_nit, rol } = req.body;

        // Validacion de politica de seguridad
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if (!regexPassword.test(password)) {
            return res.status(400).json({ 
                message: "La contraseña debe tener minimo 8 caracteres, incluir mayusculas, minusculas, numeros y un caracter especial." 
            });
        }

        try {
            // Verificacion de duplicados (Email o CI)
            const usuarioExistente = await db.query(
                'SELECT email, ci_nit FROM usuarios WHERE email = $1 OR ci_nit = $2',
                [email, ci_nit]
            );

            if (usuarioExistente.rows.length > 0) {
                return res.status(400).json({ 
                    message: "El correo electronico o el CI ya se encuentran registrados." 
                });
            }

            // Encriptacion
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insercion
            const query = `
                INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, ci_nit, rol)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING usuario_id;
            `;
            const values = [nombre_completo, email, passwordHash, telefono, ci_nit, rol];
            
            const resultado = await db.query(query, values);
            
            res.status(201).json({ 
                message: "Usuario registrado con exito", 
                id: resultado.rows[0].usuario_id 
            });
        } catch (error) {
            console.error("Error en registro:", error);
            res.status(500).json({ message: "Error interno del servidor al procesar el registro." });
        }
    },
    login: async (req, res) => {
        const { email, password } = req.body;

        try {
            // 1. Buscar al usuario por email
            const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            const usuario = result.rows[0];

            // 2. Comparar la contraseña ingresada con el hash de la BD[cite: 1]
            const validPassword = await bcrypt.compare(password, usuario.password_hash);
            
            if (!validPassword) {
                return res.status(401).json({ message: "Contraseña incorrecta" });
            }

            // 3. Generar el Token (JWT)[cite: 1]
            // Incluimos el ID y el Rol para que el Frontend sepa qué permisos mostrar
            const token = jwt.sign(
                { id: usuario.usuario_id, rol: usuario.rol },
                process.env.JWT_SECRET,
                { expiresIn: '8h' } // El token expira en una jornada laboral técnica
            );

            res.status(200).json({
                message: "Autenticacion exitosa",
                token: token,
                user: {
                    nombre: usuario.nombre_completo,
                    rol: usuario.rol
                }
            });

        } catch (error) {
            console.error("Error en login:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
};

module.exports = authController;