const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Cabecera completa recibida:", authHeader);
    console.log("Token extraído por el backend:", token);
    if (!token) {
        return res.status(401).json({ 
            message: "Acceso denegado. No se proporciono un token de seguridad." 
        });
    }
    try {
        // 2. Verificar el token usando la llave secreta del .env
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Inyectar los datos del usuario (id y rol) en el objeto 'req'
        // Esto permite que los siguientes controladores sepan quien opera
        req.usuario = verificado;
        
        // Continuar al siguiente paso (Controlador)
        next();
    } catch (error) {
        res.status(403).json({ 
            message: "Token invalido o expirado. Por favor, inicie sesion nuevamente." 
        });
    }
};

module.exports = verificarToken;