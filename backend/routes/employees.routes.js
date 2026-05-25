const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../connection/db');

// GET /api/employees - Listar todos los empleados (datos de planilla)
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    idemp, nombre, apellido, cargo,
                    sueldo_base, asignacion_familiar, horas_extra,
                    nombre_afp, tasa_afp
                FROM employees
                ORDER BY idemp
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener empleados:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/employees/stats/summary - Estadísticas para el dashboard
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar que 'stats' sea capturado como parámetro
router.get('/stats/summary', async (req, res) => {
    try {
        const pool = await poolPromise;

        const totalEmps = await pool.request().query('SELECT COUNT(*) as total FROM employees');
        const totalPayroll = await pool.request().query(`
            SELECT SUM(sueldo_base + asignacion_familiar + horas_extra - 
                ((sueldo_base + asignacion_familiar + horas_extra) * tasa_afp)
            ) as total_neto FROM employees
        `);
        const pendingVacations = await pool.request().query(`
            SELECT COUNT(*) as pendientes FROM vacations_requests WHERE estado = 'Pendiente'
        `);

        // Tasa de asistencia de hoy
        const todayStr = new Date().toISOString().split('T')[0];
        const attendanceToday = await pool.request()
            .input('fecha', sql.Date, todayStr)
            .query(`
                SELECT 
                    COUNT(CASE WHEN estado IN ('Puntual', 'Tardanza') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as tasa
                FROM attendance WHERE fecha = @fecha
            `);

        res.json({
            totalEmployees: totalEmps.recordset[0].total,
            totalPayroll: totalPayroll.recordset[0].total_neto || 0,
            pendingVacations: pendingVacations.recordset[0].pendientes,
            attendanceRate: attendanceToday.recordset[0].tasa || 0
        });
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/employees/:id - Obtener un empleado por ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM employees WHERE idemp = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener empleado:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/employees - Registrar un nuevo empleado en planilla
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, cargo, sueldo_base, asignacion_familiar, horas_extra, nombre_afp, tasa_afp } = req.body;

        if (!nombre || !apellido || !cargo || !sueldo_base || !nombre_afp || tasa_afp === undefined) {
            return res.status(400).json({ error: 'Faltan campos obligatorios.' });
        }

        const pool = await poolPromise;

        // Insertar empleado
        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('cargo', sql.VarChar, cargo)
            .input('sueldo_base', sql.Decimal(10, 2), sueldo_base)
            .input('asignacion_familiar', sql.Decimal(10, 2), asignacion_familiar || 0)
            .input('horas_extra', sql.Decimal(10, 2), horas_extra || 0)
            .input('nombre_afp', sql.VarChar, nombre_afp)
            .input('tasa_afp', sql.Decimal(5, 4), tasa_afp)
            .query(`
                INSERT INTO employees (nombre, apellido, cargo, sueldo_base, asignacion_familiar, horas_extra, nombre_afp, tasa_afp)
                OUTPUT INSERTED.*
                VALUES (@nombre, @apellido, @cargo, @sueldo_base, @asignacion_familiar, @horas_extra, @nombre_afp, @tasa_afp)
            `);

        const nuevoEmpleado = result.recordset[0];

        // Crear balance de vacaciones automáticamente (30 días por defecto)
        await pool.request()
            .input('idemp', sql.Int, nuevoEmpleado.idemp)
            .query('INSERT INTO vacations_balance (idemp, totales, tomados, disponibles) VALUES (@idemp, 30, 0, 30)');

        res.status(201).json({
            message: 'Empleado registrado exitosamente.',
            employee: nuevoEmpleado
        });
    } catch (err) {
        console.error('Error al registrar empleado:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/employees/:id - Actualizar datos de un empleado
router.put('/:id', async (req, res) => {
    try {
        const { nombre, apellido, cargo, sueldo_base, asignacion_familiar, horas_extra, nombre_afp, tasa_afp } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('cargo', sql.VarChar, cargo)
            .input('sueldo_base', sql.Decimal(10, 2), sueldo_base)
            .input('asignacion_familiar', sql.Decimal(10, 2), asignacion_familiar || 0)
            .input('horas_extra', sql.Decimal(10, 2), horas_extra || 0)
            .input('nombre_afp', sql.VarChar, nombre_afp)
            .input('tasa_afp', sql.Decimal(5, 4), tasa_afp)
            .query(`
                UPDATE employees SET
                    nombre = @nombre,
                    apellido = @apellido,
                    cargo = @cargo,
                    sueldo_base = @sueldo_base,
                    asignacion_familiar = @asignacion_familiar,
                    horas_extra = @horas_extra,
                    nombre_afp = @nombre_afp,
                    tasa_afp = @tasa_afp
                WHERE idemp = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }

        res.json({ message: 'Empleado actualizado exitosamente.' });
    } catch (err) {
        console.error('Error al actualizar empleado:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// DELETE /api/employees/:id - Eliminar un empleado de la planilla
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM employees WHERE idemp = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }

        res.json({ message: 'Empleado eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar empleado:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
