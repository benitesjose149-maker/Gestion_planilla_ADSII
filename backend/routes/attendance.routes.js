const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../connection/db');

// GET /api/attendance - Listar asistencia (opcionalmente filtrar por fecha)
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { fecha } = req.query;

        let query = `
            SELECT 
                a.id_attendance,
                e.idemp,
                e.nombre + ' ' + e.apellido AS empleado,
                a.fecha, 
                a.entrada, 
                a.salida, 
                a.estado
            FROM attendance a
            INNER JOIN employees e ON a.idemp = e.idemp
        `;

        let request = pool.request();

        if (fecha) {
            query += ' WHERE a.fecha = @fecha';
            request.input('fecha', sql.Date, fecha);
        }

        query += ' ORDER BY a.fecha DESC, e.nombre';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener asistencia:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/attendance/stats - Estadísticas de asistencia de hoy
router.get('/stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { fecha } = req.query;
        const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

        const result = await pool.request()
            .input('fecha', sql.Date, fechaConsulta)
            .query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN estado = 'Puntual' THEN 1 END) as puntuales,
                    COUNT(CASE WHEN estado = 'Tardanza' THEN 1 END) as tardanzas,
                    COUNT(CASE WHEN estado = 'Falta' THEN 1 END) as faltas,
                    COUNT(CASE WHEN estado = 'Permiso' THEN 1 END) as permisos,
                    CAST(
                        COUNT(CASE WHEN estado = 'Puntual' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(CASE WHEN estado IN ('Puntual', 'Tardanza') THEN 1 END), 0) 
                    AS DECIMAL(5,1)) as tasa_puntualidad
                FROM attendance 
                WHERE fecha = @fecha
            `);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener estadísticas de asistencia:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/attendance/clock-in - Marcar entrada
router.post('/clock-in', async (req, res) => {
    try {
        const { idemp } = req.body;

        if (!idemp) {
            return res.status(400).json({ error: 'Se requiere el ID del empleado.' });
        }

        const pool = await poolPromise;
        const hoy = new Date().toISOString().split('T')[0];

        // Verificar si ya tiene un registro hoy
        const existente = await pool.request()
            .input('idemp', sql.Int, idemp)
            .input('fecha', sql.Date, hoy)
            .query('SELECT * FROM attendance WHERE idemp = @idemp AND fecha = @fecha');

        if (existente.recordset.length > 0 && existente.recordset[0].entrada !== '---') {
            return res.status(400).json({ error: 'Ya registraste tu entrada el día de hoy.' });
        }

        const ahora = new Date();
        const horas = ahora.getHours();
        const minutos = ahora.getMinutes();
        const ampm = horas >= 12 ? 'PM' : 'AM';
        const hora12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
        const horaFormateada = `${String(hora12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${ampm}`;

        // Determinar si es puntual o tardanza (límite: 08:15 AM)
        const estado = (horas > 8 || (horas === 8 && minutos > 15)) ? 'Tardanza' : 'Puntual';

        if (existente.recordset.length > 0) {
            // Actualizar el registro existente (que fue creado como Falta por defecto)
            await pool.request()
                .input('idemp', sql.Int, idemp)
                .input('fecha', sql.Date, hoy)
                .input('entrada', sql.VarChar, horaFormateada)
                .input('estado', sql.VarChar, estado)
                .query(`
                    UPDATE attendance 
                    SET entrada = @entrada, estado = @estado
                    WHERE idemp = @idemp AND fecha = @fecha
                `);
        } else {
            // Crear nuevo registro
            await pool.request()
                .input('idemp', sql.Int, idemp)
                .input('fecha', sql.Date, hoy)
                .input('entrada', sql.VarChar, horaFormateada)
                .input('estado', sql.VarChar, estado)
                .query(`
                    INSERT INTO attendance (idemp, fecha, entrada, salida, estado)
                    VALUES (@idemp, @fecha, @entrada, '---', @estado)
                `);
        }

        res.json({
            message: `Entrada registrada a las ${horaFormateada}`,
            hora: horaFormateada,
            estado: estado
        });
    } catch (err) {
        console.error('Error al marcar entrada:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/attendance/clock-out - Marcar salida
router.post('/clock-out', async (req, res) => {
    try {
        const { idemp } = req.body;

        if (!idemp) {
            return res.status(400).json({ error: 'Se requiere el ID del empleado.' });
        }

        const pool = await poolPromise;
        const hoy = new Date().toISOString().split('T')[0];

        // Verificar si tiene un registro de entrada hoy
        const existente = await pool.request()
            .input('idemp', sql.Int, idemp)
            .input('fecha', sql.Date, hoy)
            .query('SELECT * FROM attendance WHERE idemp = @idemp AND fecha = @fecha');

        if (existente.recordset.length === 0 || existente.recordset[0].entrada === '---') {
            return res.status(400).json({ error: 'Primero debes registrar tu entrada.' });
        }

        if (existente.recordset[0].salida !== '---') {
            return res.status(400).json({ error: 'Ya registraste tu salida el día de hoy.' });
        }

        const ahora = new Date();
        const horas = ahora.getHours();
        const minutos = ahora.getMinutes();
        const ampm = horas >= 12 ? 'PM' : 'AM';
        const hora12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
        const horaFormateada = `${String(hora12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${ampm}`;

        await pool.request()
            .input('idemp', sql.Int, idemp)
            .input('fecha', sql.Date, hoy)
            .input('salida', sql.VarChar, horaFormateada)
            .query(`
                UPDATE attendance 
                SET salida = @salida
                WHERE idemp = @idemp AND fecha = @fecha
            `);

        res.json({
            message: `Salida registrada a las ${horaFormateada}`,
            hora: horaFormateada
        });
    } catch (err) {
        console.error('Error al marcar salida:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
