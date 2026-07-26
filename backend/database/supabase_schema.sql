-- PostgreSQL / Supabase Schema for MEDUCA Coclé - Sistema de Control de Préstamo de Herramientas

-- 1. Create Enums safely
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

-- 2. Table: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_usuario DEFAULT 'Administrador',
  estado estado_usuario DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
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

-- 4. Table: herramientas
CREATE TABLE IF NOT EXISTS herramientas (
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

-- 5. Table: prestamos
CREATE TABLE IF NOT EXISTS prestamos (
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

-- 6. Table: prestamo_detalles
CREATE TABLE IF NOT EXISTS prestamo_detalles (
  id SERIAL PRIMARY KEY,
  prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  herramienta_id INT NOT NULL REFERENCES herramientas(id) ON DELETE CASCADE,
  estado_entrega condicion_herramienta DEFAULT 'Bueno',
  estado_devolucion condicion_herramienta,
  observaciones TEXT
);

-- 7. Table: devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id SERIAL PRIMARY KEY,
  prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  usuario_registro_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_devolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT
);

-- 8. Table: historial_actividades
CREATE TABLE IF NOT EXISTS historial_actividades (
  id SERIAL PRIMARY KEY,
  usuario_id INT,
  usuario_nombre VARCHAR(100) NOT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT,
  detalle TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255)
);

-- Enable RLS & Allow public access for application tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamo_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All Operations" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON herramientas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON prestamos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON prestamo_detalles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON devoluciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON historial_actividades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations" ON configuracion FOR ALL USING (true) WITH CHECK (true);

-- SEED INITIAL DATA
INSERT INTO usuarios (id, nombre, usuario, email, password_hash, rol) 
VALUES (1, 'Carlos Admin', 'admin', 'admin.cocle@meduca.gob.pa', '$2y$10$wE9K4mIuY.p4.pX3b8rO5eQYJm.xYQxX9b7.O3sXp4oZpZpZpZpZ.', 'Administrador')
ON CONFLICT (id) DO NOTHING;

INSERT INTO funcionarios (cedula, nombre, apellido, cargo, departamento, telefono, email) VALUES
('2-708-2233', 'Carlos', 'Mendoza', 'Técnico de Mantenimiento', 'Mantenimiento General', '6700-1122', 'carlos.mendoza@meduca.gob.pa'),
('2-712-8811', 'Andrés', 'Ortega', 'Electricista Institucional', 'Electricidad y Clima', '6711-2233', 'andres.ortega@meduca.gob.pa'),
('2-705-4433', 'Miguel', 'Sánchez', 'Plomero General', 'Plomería y Agua', '6722-3344', 'miguel.sanchez@meduca.gob.pa'),
('2-720-9988', 'Pedro', 'Rodríguez', 'Carpintero de Mantenimiento', 'Carpintería', '6733-4455', 'pedro.rodriguez@meduca.gob.pa'),
('2-715-5678', 'Luis', 'González', 'Técnico en Refrigeración', 'Electricidad y Clima', '6744-5566', 'luis.gonzalez@meduca.gob.pa'),
('2-710-1234', 'Juan', 'Pérez', 'Pintor Institucional', 'Mantenimiento General', '6755-6677', 'juan.perez@meduca.gob.pa')
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO herramientas (codigo, nombre, marca, modelo, numero_serie, estado, ubicacion, observaciones) VALUES
('HER-001', 'Taladro Eléctrico 1/2', 'DeWalt', 'DWD112', 'SN-DEW-991', 'Prestado', 'Estante A-1', 'Taladro percutor de alto rendimiento'),
('HER-002', 'Esmeril Angular 4-1/2', 'Makita', 'GA4530', 'SN-MAK-442', 'Prestado', 'Estante A-2', 'Esmeril angular 720W'),
('HER-003', 'Escalera Extensible 16 pies', 'Cuprum', 'PRO-16', 'SN-CUP-112', 'Prestado', 'Bodega Exterior', 'Escalera de aluminio reforzada'),
('HER-004', 'Pinza Amperimétrica Fluke 325', 'Fluke', 'F325', 'SN-STA-881', 'Disponible', 'Estante B-1 (Instrumentos)', 'Pinza con medición de True-RMS'),
('HER-005', 'Manifold para Refrigeración', 'Yellow Jacket', 'YJ-42004', 'SN-YJ-551', 'Dañado', 'Estante C-1', 'Manifold con mangueras de alta presión'),
('HER-006', 'Juego de Destornilladores Stanley', 'Stanley', 'STHT60084', 'SN-STA-332', 'Disponible', 'Caja de Herramientas #3', 'Juego de 10 piezas aisladas'),
('HER-007', 'Sierra Circular 7 1/4', 'Stanley', 'STSC1718', 'SN-STA-881', 'Disponible', 'Estante A-3', 'Sierra de disco para madera'),
('HER-008', 'Compresor de Aire 24L', 'Truper', 'COMP-24X', 'SN-TRU-109', 'Mantenimiento', 'Taller Central', 'En revisión de aceite y filtro'),
('HER-009', 'Pulidora Angular 7', 'Makita', '9557HNG', 'SN-MAK-901', 'Disponible', 'Estante A-2', 'Pulidora industrial'),
('HER-010', 'Martillo Perforador SDS Plus', 'Hilti', 'TE-2', 'SN-HIL-001', 'Dañado', 'Bodega de Enseres', 'Requiere cambio de gatillo')
ON CONFLICT (codigo) DO NOTHING;
