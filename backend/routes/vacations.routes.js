const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../connection/db');

// GET /api/vacations/requests - Listar todas las solicitudes de vacaciones
router.get('/requests', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    vr.id_request, 
                    e.idemp,
                    e.nombre + ' ' + e.apellido AS empleado,
                    vr.dias, 
                    vr.fecha_inicio, 
                    vr.fecha_fin, 
                    vr.estado
                FROM vacations_requests vr
                INNER JOIN employees e ON vr.idemp = e.idemp
                ORDER BY 
                    CASE vr.estado WHEN 'Pendiente' THEN 0 WHEN 'Aprobado' THEN 1 ELSE 2 END,
                    vr.id_request DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener solicitudes:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/vacations/balances - Listar balances de vacaciones de todos los empleados
router.get('/balances', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    vb.id_balance,
                    e.idemp,
                    e.nombre + ' ' + e.apellido AS empleado,
                    vb.totales, 
                    vb.tomados, 
                    vb.disponibles
                FROM vacations_balance vb
                INNER JOIN employees e ON vb.idemp = e.idemp
                ORDER BY e.nombre
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener balances:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/vacations/requests - Crear nueva solicitud de vacaciones
router.post('/requests', async (req, res) => {
    try {
        const { idemp, dias, fecha_inicio, fecha_fin } = req.body;

        if (!idemp || !dias || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const pool = await poolPromise;

        // Verificar que el empleado tiene días disponibles
        const balance = await pool.request()
            .input('idemp', sql.Int, idemp)
            .query('SELECT disponibles FROM vacations_balance WHERE idemp = @idemp');

        if (balance.recordset.length === 0) {
            return res.status(404).json({ error: 'No se encontró balance de vacaciones para este empleado.' });
        }

        if (balance.recordset[0].disponibles < dias) {
            return res.status(400).json({ 
                error: `Días insuficientes. Disponibles: ${balance.recordset[0].disponibles}, Solicitados: ${dias}` 
            });
        }

        // Crear solicitud
        const result = await pool.request()
            .input('idemp', sql.Int, idemp)
            .input('dias', sql.Int, dias)
            .input('fecha_inicio', sql.Date, fecha_inicio)
            .input('fecha_fin', sql.Date, fecha_fin)
            .query(`
                INSERT INTO vacations_requests (idemp, dias, fecha_inicio, fecha_fin, estado)
                OUTPUT INSERTED.*
                VALUES (@idemp, @dias, @fecha_inicio, @fecha_fin, 'Pendiente')
            `);

        res.status(201).json({
            message: 'Solicitud de vacaciones creada exitosamente.',
            request: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al crear solicitud:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/vacations/requests/:id/approve - Aprobar solicitud de vacaciones
router.put('/requests/:id/approve', async (req, res) => {
    try {
        const pool = await poolPromise;

        // Obtener los datos de la solicitud
        const solicitud = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM vacations_requests WHERE id_request = @id');

        if (solicitud.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        const sol = solicitud.recordset[0];

        if (sol.estado !== 'Pendiente') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada.' });
        }

        // Actualizar estado de la solicitud a Aprobado
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE vacations_requests SET estado = 'Aprobado' WHERE id_request = @id");

        // Descontar días del balance
        await pool.request()
            .input('idemp', sql.Int, sol.idemp)
            .input('dias', sql.Int, sol.dias)
            .query(`
                UPDATE vacations_balance 
                SET tomados = tomados + @dias,
                    disponibles = disponibles - @dias
                WHERE idemp = @idemp
            `);

        res.json({ message: 'Solicitud aprobada y balance actualizado.' });
    } catch (err) {
        console.error('Error al aprobar solicitud:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/vacations/requests/:id/reject - Rechazar solicitud de vacaciones
router.put('/requests/:id/reject', async (req, res) => {
    try {
        const pool = await poolPromise;

        const solicitud = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM vacations_requests WHERE id_request = @id');

        if (solicitud.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        if (solicitud.recordset[0].estado !== 'Pendiente') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada.' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE vacations_requests SET estado = 'Rechazado' WHERE id_request = @id");

        res.json({ message: 'Solicitud rechazada.' });
    } catch (err) {
        console.error('Error al rechazar solicitud:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
