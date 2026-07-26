-- PostgreSQL / Supabase Complete Schema & Full Seed Data
-- MEDUCA Coclé - Sistema de Control de Préstamo de Herramientas

-- 1. Drop existing tables if re-running
DROP TABLE IF EXISTS historial_actividades CASCADE;
DROP TABLE IF EXISTS devoluciones CASCADE;
DROP TABLE IF EXISTS prestamo_detalles CASCADE;
DROP TABLE IF EXISTS prestamos CASCADE;
DROP TABLE IF EXISTS herramientas CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;

-- 2. Create Enums safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE rol_usuario AS ENUM ('Administrador', 'Supervisor', 'Operador');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_usuario') THEN
        CREATE TYPE estado_usuario AS ENUM ('Activo', 'Inactivo');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_funcionario') THEN
        CREATE TYPE estado_funcionario AS ENUM ('Activo', 'Inactivo');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_herramienta') THEN
        CREATE TYPE estado_herramienta AS ENUM ('Disponible', 'Prestado', 'Mantenimiento', 'Dañado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_prestamo') THEN
        CREATE TYPE estado_prestamo AS ENUM ('Prestado', 'Devuelto', 'Vencido', 'Cancelado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'condicion_herramienta') THEN
        CREATE TYPE condicion_herramienta AS ENUM ('Excelente', 'Bueno', 'Regular', 'Con Daño');
    END IF;
END $$;

-- 3. Table: usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_usuario DEFAULT 'Administrador',
  estado estado_usuario DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: funcionarios
CREATE TABLE funcionarios (
  id SERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) DEFAULT 'Mantenimiento',
  telefono VARCHAR(20),
  email VARCHAR(100),
  estado estado_funcionario DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: herramientas
CREATE TABLE herramientas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100),
  numero_serie VARCHAR(100),
  estado estado_herramienta DEFAULT 'Disponible',
  ubicacion VARCHAR(100) DEFAULT 'Bodega Mantenimiento',
  foto_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table: prestamos
CREATE TABLE prestamos (
  id SERIAL PRIMARY KEY,
  codigo_prestamo VARCHAR(30) NOT NULL UNIQUE,
  funcionario_id INT NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  usuario_registro_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  escuela_proyecto VARCHAR(150) NOT NULL,
  fecha_prestamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_devolucion_estimada DATE,
  fecha_devolucion_real TIMESTAMP,
  estado estado_prestamo DEFAULT 'Prestado',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table: prestamo_detalles
CREATE TABLE prestamo_detalles (
  id SERIAL PRIMARY KEY,
  prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  herramienta_id INT NOT NULL REFERENCES herramientas(id) ON DELETE CASCADE,
  estado_entrega condicion_herramienta DEFAULT 'Bueno',
  estado_devolucion condicion_herramienta,
  observaciones TEXT
);

-- 8. Table: devoluciones
CREATE TABLE devoluciones (
  id SERIAL PRIMARY KEY,
  prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  usuario_registro_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_devolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT
);

-- 9. Table: historial_actividades
CREATE TABLE historial_actividades (
  id SERIAL PRIMARY KEY,
  usuario_id INT,
  usuario_nombre VARCHAR(100) NOT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT,
  detalle TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table: configuracion
CREATE TABLE configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255)
);

-- Disable RLS to allow direct Supabase client queries
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE herramientas DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamo_detalles DISABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_actividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion DISABLE ROW LEVEL SECURITY;

-- SEED DATA

-- Usuarios
INSERT INTO usuarios (id, nombre, usuario, email, password_hash, rol, estado) VALUES
(1, 'Carlos Admin', 'admin', 'carlos.admin@meduca.gob.pa', '$2y$10$L6xQ53ttMr9Q9pnqeRjZOuF2UBZ2viKFafJ4Rg3AVIo0pv7AsL7oe', 'Administrador', 'Activo');

-- Funcionarios
INSERT INTO funcionarios (id, cedula, nombre, apellido, cargo, departamento, telefono, email) VALUES
(1, '2-710-1234', 'Juan', 'Pérez', 'Técnico Electricista', 'Mantenimiento - Electricidad', '6501-1122', 'juan.perez@meduca.gob.pa'),
(2, '2-715-5678', 'Luis', 'González', 'Técnico de Mantenimiento', 'Mantenimiento General', '6502-3344', 'luis.gonzalez@meduca.gob.pa'),
(3, '2-720-9988', 'Pedro', 'Rodríguez', 'Técnico General', 'Mantenimiento General', '6503-5566', 'pedro.rodriguez@meduca.gob.pa'),
(4, '2-705-4433', 'Miguel', 'Sánchez', 'Técnico Electricista', 'Mantenimiento - Electricidad', '6504-7788', 'miguel.sanchez@meduca.gob.pa'),
(5, '2-712-8811', 'Andrés', 'Ortega', 'Técnico de Refrigeración', 'Mantenimiento - Refrigeración', '6505-9900', 'andres.ortega@meduca.gob.pa'),
(6, '2-708-2233', 'Carlos', 'Mendoza', 'Técnico General', 'Mantenimiento General', '6506-1133', 'carlos.mendoza@meduca.gob.pa'),
(7, '2-719-4455', 'Ana', 'Martínez', 'Electricista', 'Mantenimiento - Electricidad', '6507-2244', 'ana.martinez@meduca.gob.pa');

-- Herramientas
INSERT INTO herramientas (id, codigo, nombre, marca, modelo, numero_serie, estado, ubicacion, foto_url, observaciones) VALUES
(1, 'HER-001', 'Taladro Eléctrico 1/2', 'DeWalt', 'DWD112', 'SN-DEW-991', 'Prestado', 'Estante A-1', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop', 'Taladro percutor de alto rendimiento'),
(2, 'HER-002', 'Esmeril Angular 4-1/2', 'Makita', 'GA4530', 'SN-MAK-442', 'Prestado', 'Estante A-2', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop', 'Esmeril angular 720W'),
(3, 'HER-003', 'Escalera Extensible 16 pies', 'Cuprum', 'PRO-16', 'SN-CUP-112', 'Prestado', 'Bodega Exterior', 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=500&auto=format&fit=crop', 'Escalera de aluminio reforzado'),
(4, 'HER-004', 'Pinza Amperimétrica Fluke 325', 'Fluke', 'F325', 'SN-FLU-883', 'Prestado', 'Estante B-1 (Instrumentos)', 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=500&auto=format&fit=crop', 'Pinza con medición de True-RMS'),
(5, 'HER-005', 'Manifold para Refrigeración', 'Yellow Jacket', 'YJ-42004', 'SN-YJ-551', 'Prestado', 'Estante C-1', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', 'Manifold con mangueras de alta presión'),
(6, 'HER-006', 'Juego de Destornilladores Stanley', 'Stanley', 'STHT60084', 'SN-STA-332', 'Disponible', 'Caja de Herramientas #3', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&auto=format&fit=crop', 'Juego de 10 piezas aisladas 1000V'),
(7, 'HER-007', 'Sierra Circular 7-1/4', 'Stanley', 'STSC1718', 'SN-STA-881', 'Disponible', 'Estante A-3', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop', 'Sierra de disco para madera'),
(8, 'HER-008', 'Compresor de Aire 24L', 'Truper', 'COMP-24X', 'SN-TRU-109', 'Mantenimiento', 'Taller Central', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop', 'En revisión de aceite y filtro'),
(9, 'HER-009', 'Pulidora Angular 7', 'Makita', '9557HNG', 'SN-MAK-901', 'Disponible', 'Estante A-2', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop', 'Pulidora industrial'),
(10, 'HER-010', 'Martillo Perforador SDS Plus', 'Hilti', 'TE-2', 'SN-HIL-004', 'Dañado', 'Bodega de Enseres', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop', 'Requiere cambio de gatillo e interruptor');

-- Préstamos
INSERT INTO prestamos (id, codigo_prestamo, funcionario_id, usuario_registro_id, escuela_proyecto, fecha_prestamo, fecha_devolucion_estimada, fecha_devolucion_real, estado, observaciones) VALUES
(1, 'PRE-2025-001', 1, 1, 'Escuela José María La Vega', '2025-05-20 08:30:00', '2025-05-27', NULL, 'Prestado', 'Reparación de sistema eléctrico de aulas 1 a 4'),
(2, 'PRE-2025-002', 2, 1, 'C.E.B.G. Ricardo Miró', '2025-05-20 09:15:00', '2025-05-25', NULL, 'Prestado', 'Instalación de estructuras metálicas'),
(3, 'PRE-2025-003', 3, 1, 'Escuela de El Copé', '2025-05-21 10:00:00', '2025-05-28', NULL, 'Prestado', 'Mantenimiento de techado de gimnasio'),
(4, 'PRE-2025-004', 4, 1, 'Proyecto: Mejora de Aulas - Penonomé', '2025-05-22 11:20:00', '2025-05-29', NULL, 'Prestado', 'Medición de carga panel principal'),
(5, 'PRE-2025-005', 5, 1, 'C.E.B.G. Pablo Neruda', '2025-05-22 14:00:00', '2025-05-26', NULL, 'Prestado', 'Revisión y carga de gas en acondicionadores de aire'),
(6, 'PRE-2025-000', 6, 1, 'Escuela El Churuquita Grande', '2025-05-15 08:00:00', '2025-05-19', '2025-05-19 16:30:00', 'Devuelto', 'Ajuste general de mobiliario escolar');

-- Detalles de Préstamo
INSERT INTO prestamo_detalles (id, prestamo_id, herramienta_id, estado_entrega, estado_devolucion, observaciones) VALUES
(1, 1, 1, 'Excelente', NULL, 'Se entrega con brocas'),
(2, 2, 2, 'Bueno', NULL, 'Con disco de corte instalado'),
(3, 3, 3, 'Bueno', NULL, 'Zapatas antideslizantes comprobadas'),
(4, 4, 4, 'Excelente', NULL, 'Puntas de prueba integradas'),
(5, 5, 5, 'Bueno', NULL, 'Mangueras azul y roja probadas'),
(6, 6, 6, 'Excelente', 'Excelente', 'Devuelto completo en su estuche original');

-- Devoluciones
INSERT INTO devoluciones (id, prestamo_id, usuario_registro_id, fecha_devolucion, observaciones) VALUES
(1, 6, 1, '2025-05-19 16:30:00', 'Herramienta devuelta en óptimas condiciones por Carlos Mendoza');

-- Historial de Actividades
INSERT INTO historial_actividades (id, usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle, fecha) VALUES
(1, 1, 'Carlos Admin', 'Inicio de Sesión', 'Auth', 1, 'Usuario Administrador inició sesión', '2025-05-22 08:00:00'),
(2, 1, 'Carlos Admin', 'Nuevo Préstamo', 'Prestamos', 5, 'Se registró el préstamo PRE-2025-005 para Andrés Ortega', '2025-05-22 14:00:00'),
(3, 1, 'Carlos Admin', 'Nuevo Préstamo', 'Prestamos', 4, 'Se registró el préstamo PRE-2025-004 para Miguel Sánchez', '2025-05-22 11:20:00'),
(4, 1, 'Carlos Admin', 'Devolución', 'Devoluciones', 1, 'Devolución registrada para préstamo PRE-2025-000', '2025-05-19 16:30:00'),
(5, 1, 'Carlos Admin', 'Creación Herramienta', 'Herramientas', 6, 'Herramienta HER-006 (Juego de Destornilladores Stanley) agregada', '2025-05-15 07:45:00');

-- Configuración
INSERT INTO configuracion (id, clave, valor, descripcion) VALUES
(1, 'sistema_nombre', 'Sistema de Control de Préstamo de Herramientas', 'Nombre público del sistema'),
(2, 'institucion_nombre', 'MEDUCA Coclé - Departamento de Mantenimiento', 'Institución responsable'),
(3, 'version', '1.0.0', 'Versión instalada'),
(4, 'contacto_soporte', 'soporte.cocle@meduca.gob.pa', 'Correo de soporte técnico'),
(5, 'dias_max_prestamo', '7', 'Días máximos de préstamo por defecto');

-- Reset sequences so new auto-increment IDs start correctly
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('funcionarios_id_seq', (SELECT MAX(id) FROM funcionarios));
SELECT setval('herramientas_id_seq', (SELECT MAX(id) FROM herramientas));
SELECT setval('prestamos_id_seq', (SELECT MAX(id) FROM prestamos));
SELECT setval('prestamo_detalles_id_seq', (SELECT MAX(id) FROM prestamo_detalles));
SELECT setval('devoluciones_id_seq', (SELECT MAX(id) FROM devoluciones));
SELECT setval('historial_actividades_id_seq', (SELECT MAX(id) FROM historial_actividades));
SELECT setval('configuracion_id_seq', (SELECT MAX(id) FROM configuracion));
