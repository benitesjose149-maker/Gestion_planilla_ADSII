const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const employeesRoutes = require('./routes/employees.routes');
const vacationsRoutes = require('./routes/vacations.routes');
const attendanceRoutes = require('./routes/attendance.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({
        message: '🚀 API PayrollPro - Gestión de Planillas',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            employees: '/api/employees',
            vacations: '/api/vacations',
            attendance: '/api/attendance'
        }
    });
});

// Registrar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/vacations', vacationsRoutes);
app.use('/api/attendance', attendanceRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});
