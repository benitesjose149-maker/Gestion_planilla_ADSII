-- 1. CREACIÓN DE LA BASE DE DATOS
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Gestion_planilla_ADSII')
BEGIN
    CREATE DATABASE Gestion_planilla_ADSII;
END
GO

USE Gestion_planilla_ADSII;
GO

-- Eliminar tablas si ya existen (para poder re-ejecutar el script limpiamente)
IF OBJECT_ID('dbo.attendance', 'U') IS NOT NULL DROP TABLE dbo.attendance;
IF OBJECT_ID('dbo.vacations_requests', 'U') IS NOT NULL DROP TABLE dbo.vacations_requests;
IF OBJECT_ID('dbo.vacations_balance', 'U') IS NOT NULL DROP TABLE dbo.vacations_balance;
IF OBJECT_ID('dbo.employees', 'U') IS NOT NULL DROP TABLE dbo.employees;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- 2. CREACIÓN DE TABLAS

-- Tabla de Usuarios del Sistema (Para el Login)
CREATE TABLE users (
    idUsers INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    correo VARCHAR(50) NOT NULL,
    rol VARCHAR(20) NOT NULL -- 'Administrador', 'Supervisor'
);
GO

-- Tabla de Empleados (Corregida y ampliada con campos de planilla)
CREATE TABLE employees (
    idemp INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    sueldo_base DECIMAL(10,2) NOT NULL,
    asignacion_familiar DECIMAL(10,2) DEFAULT 0.00, -- S/ 102.50 si aplica
    horas_extra DECIMAL(10,2) DEFAULT 0.00,
    nombre_afp VARCHAR(30) NOT NULL, -- 'Integra', 'Prima', 'Profuturo', 'ONP'
    tasa_afp DECIMAL(5,4) NOT NULL   -- e.g. 0.1200, 0.1280, 0.1190, 0.1300
);
GO

-- Tabla de Balances de Vacaciones por Empleado
CREATE TABLE vacations_balance (
    id_balance INT IDENTITY(1,1) PRIMARY KEY,
    idemp INT NOT NULL FOREIGN KEY REFERENCES employees(idemp) ON DELETE CASCADE,
    totales INT DEFAULT 30,
    tomados INT DEFAULT 0,
    disponibles INT DEFAULT 30
);
GO

-- Tabla de Solicitudes de Vacaciones
CREATE TABLE vacations_requests (
    id_request INT IDENTITY(1,1) PRIMARY KEY,
    idemp INT NOT NULL FOREIGN KEY REFERENCES employees(idemp) ON DELETE CASCADE,
    dias INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'Pendiente' -- 'Pendiente', 'Aprobado', 'Rechazado'
);
GO

-- Tabla de Asistencia Diaria
CREATE TABLE attendance (
    id_attendance INT IDENTITY(1,1) PRIMARY KEY,
    idemp INT NOT NULL FOREIGN KEY REFERENCES employees(idemp) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    entrada VARCHAR(20) DEFAULT '---',
    salida VARCHAR(20) DEFAULT '---',
    estado VARCHAR(20) DEFAULT 'Falta' -- 'Puntual', 'Tardanza', 'Falta', 'Permiso'
);
GO


-- 3. INSERTS DE DATOS DE PRUEBA

-- Inserts para la tabla de Usuarios (Login)
INSERT INTO users (nombre, password, correo, rol) VALUES 
('admin', 'admin123', 'admin@empresa.com', 'Administrador'),
('supervisor', 'planilla2026', 'supervisor@empresa.com', 'Supervisor');
GO

-- Inserts de Empleados (35 Empleados realistas de planilla)
INSERT INTO employees (nombre, apellido, cargo, sueldo_base, asignacion_familiar, horas_extra, nombre_afp, tasa_afp) VALUES
('Juan', 'Perez', 'Desarrollador Senior', 4500.00, 102.50, 250.00, 'Integra', 0.1200),
('Maria', 'Gomez', 'Analista QA', 3200.00, 0.00, 0.00, 'Prima', 0.1280),
('Carlos', 'Ruiz', 'Diseñador UI/UX', 3800.00, 102.50, 120.00, 'Profuturo', 0.1190),
('Ana', 'Castro', 'Gerente de Proyecto', 7500.00, 0.00, 0.00, 'Integra', 0.1200),
('Luis', 'Flores', 'Soporte Tecnico', 2200.00, 102.50, 80.00, 'ONP', 0.1300),
('Jorge', 'Ramirez', 'Desarrollador Junior', 2500.00, 0.00, 0.00, 'Prima', 0.1280),
('Sofia', 'Diaz', 'Especialista de HR', 3500.00, 102.50, 0.00, 'Integra', 0.1200),
('Pedro', 'Morales', 'Analista de Sistemas', 4100.00, 0.00, 150.00, 'Profuturo', 0.1190),
('Laura', 'Torres', 'Desarrollador Backend', 4600.00, 102.50, 0.00, 'ONP', 0.1300),
('Diego', 'Vargas', 'Administrador BD', 5200.00, 0.00, 0.00, 'Integra', 0.1200),
('Lucia', 'Herrera', 'Diseñador Grafico', 2800.00, 102.50, 0.00, 'Prima', 0.1280),
('Miguel', 'Rojas', 'Analista SEO', 3000.00, 0.00, 50.00, 'Profuturo', 0.1190),
('Elena', 'Guzman', 'Contadora', 4800.00, 102.50, 0.00, 'ONP', 0.1300),
('Ricardo', 'Paredes', 'Scrum Master', 6000.00, 0.00, 0.00, 'Integra', 0.1200),
('Patricia', 'Soto', 'Reclutadora', 2900.00, 102.50, 0.00, 'Prima', 0.1280),
('Gabriel', 'Mendoza', 'Desarrollador Movil', 4300.00, 0.00, 100.00, 'Profuturo', 0.1190),
('Carmen', 'Villanueva', 'Asistente Contable', 2000.00, 102.50, 40.00, 'ONP', 0.1300),
('Andres', 'Silva', 'Ingeniero de Datos', 5500.00, 0.00, 0.00, 'Integra', 0.1200),
('Gabriela', 'Rios', 'Especialista QA', 3300.00, 102.50, 0.00, 'Prima', 0.1280),
('Daniel', 'Ortega', 'Administrador Cloud', 5800.00, 0.00, 0.00, 'Profuturo', 0.1190),
('Alejandra', 'Vega', 'PMO Assistant', 3600.00, 102.50, 0.00, 'ONP', 0.1300),
('Oscar', 'Cruz', 'DevOps Engineer', 5900.00, 0.00, 200.00, 'Integra', 0.1200),
('Rosa', 'Campos', 'Directora HR', 8000.00, 102.50, 0.00, 'Prima', 0.1280),
('Francisco', 'Alvarez', 'Desarrollador Web', 3900.00, 0.00, 0.00, 'Profuturo', 0.1190),
('Teresa', 'Fuentes', 'Soporte Helpdesk', 1800.00, 102.50, 120.00, 'ONP', 0.1300),
('Javier', 'Salazar', 'Seguridad Informatica', 6200.00, 0.00, 0.00, 'Integra', 0.1200),
('Monica', 'Pena', 'Asistente de Marketing', 2500.00, 102.50, 0.00, 'Prima', 0.1280),
('Fernando', 'Cabrera', 'Desarrollador QA', 3400.00, 0.00, 0.00, 'Profuturo', 0.1190),
('Silvia', 'Delgado', 'Administradora General', 5000.00, 102.50, 0.00, 'ONP', 0.1300),
('Martin', 'Montes', 'Product Owner', 6500.00, 0.00, 0.00, 'Integra', 0.1200),
('Isabel', 'Vidal', 'Analista Funcional', 3700.00, 102.50, 0.00, 'Prima', 0.1280),
('Hector', 'Caceres', 'Desarrollador Senior', 4700.00, 0.00, 180.00, 'Profuturo', 0.1190),
('Clara', 'Miranda', 'Coordinadora HR', 4000.00, 102.50, 0.00, 'ONP', 0.1300),
('Hugo', 'Bustamante', 'UI Designer', 3100.00, 0.00, 0.00, 'Integra', 0.1200),
('Victoria', 'Guerrero', 'Desarrollador Junior', 2600.00, 102.50, 50.00, 'Prima', 0.1280);
GO

-- Inserción automatizada de Balances de Vacaciones (30 días de derecho para todos por defecto)
INSERT INTO vacations_balance (idemp, totales, tomados, disponibles)
SELECT idemp, 30, 0, 30 FROM employees;
GO

-- Actualización manual de algunos balances de vacaciones para pruebas
UPDATE vacations_balance SET tomados = 10, disponibles = 20 WHERE idemp = 1;
UPDATE vacations_balance SET tomados = 15, disponibles = 15 WHERE idemp = 2;
UPDATE vacations_balance SET tomados = 5, disponibles = 25 WHERE idemp = 3;
UPDATE vacations_balance SET tomados = 8, disponibles = 22 WHERE idemp = 5;
GO

-- Inserts en tabla de Solicitudes de Vacaciones
INSERT INTO vacations_requests (idemp, dias, fecha_inicio, fecha_fin, estado) VALUES
(1, 5, '2026-06-01', '2026-06-05', 'Pendiente'),
(2, 15, '2026-07-10', '2026-07-25', 'Aprobado'),
(3, 8, '2026-08-03', '2026-08-11', 'Rechazado'),
(5, 3, '2026-06-15', '2026-06-17', 'Pendiente'),
(7, 10, '2026-09-01', '2026-09-10', 'Pendiente'),
(10, 12, '2026-10-05', '2026-10-17', 'Aprobado');
GO

-- Inserts de Asistencia para la fecha actual (Puntual, Tardanza, Falta, Permiso)
INSERT INTO attendance (idemp, fecha, entrada, salida, estado) VALUES
(1, '2026-05-25', '08:02 AM', '05:00 PM', 'Puntual'),
(2, '2026-05-25', '07:55 AM', '05:05 PM', 'Puntual'),
(3, '2026-05-25', '08:45 AM', '05:00 PM', 'Tardanza'),
(4, '2026-05-25', '08:10 AM', '05:15 PM', 'Puntual'),
(5, '2026-05-25', '---', '---', 'Falta'),
(6, '2026-05-25', '08:00 AM', '05:00 PM', 'Puntual'),
(7, '2026-05-25', '08:05 AM', '05:00 PM', 'Puntual'),
(8, '2026-05-25', '08:25 AM', '05:00 PM', 'Tardanza'),
(9, '2026-05-25', '---', '---', 'Permiso'),
(10, '2026-05-25', '07:58 AM', '05:00 PM', 'Puntual');

-- Insertar faltas para el resto de empleados que no tienen registro para hoy
INSERT INTO attendance (idemp, fecha, entrada, salida, estado)
SELECT idemp, '2026-05-25', '---', '---', 'Falta'
FROM employees
WHERE idemp NOT IN (1,2,3,4,5,6,7,8,9,10);
GO
