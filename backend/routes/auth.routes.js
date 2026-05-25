const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../connection/db');

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { nombre, password } = req.body;

        if (!nombre || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('password', sql.VarChar, password)
            .query('SELECT idUsers,idemp, nombre, correo, rol FROM users WHERE nombre = @nombre AND password = @password');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const user = result.recordset[0];

        res.json({
            message: 'Login exitoso',
            token: 'jwt-token-' + user.idUsers + '-' + Date.now(),
            user: {
                id: user.idUsers,
                idemp: user.idemp,
                username: user.nombre,
                email: user.correo,
                role: user.rol,
                name: user.nombre
            }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/auth/users - Listar usuarios del sistema
router.get('/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT idUsers, nombre, correo, rol FROM users');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
