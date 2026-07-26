-- PostgreSQL / Supabase Schema for MEDUCA Coclé - Sistema de Control de Préstamo de Herramientas

-- Enum types
CREATE TYPE rol_usuario AS ENUM ('Administrador', 'Supervisor', 'Operador');
CREATE TYPE estado_usuario AS ENUM ('Activo', 'Inactivo');
CREATE TYPE estado_funcionario AS ENUM ('Activo', 'Inactivo');
CREATE TYPE estado_herramienta AS ENUM ('Disponible', 'Prestado', 'Mantenimiento', 'Dañado');
CREATE TYPE estado_prestamo AS ENUM ('Prestado', 'Devuelto', 'Vencido', 'Cancelado');
CREATE TYPE condicion_herramienta AS ENUM ('Excelente', 'Bueno', 'Regular', 'Con Daño');

-- 1. Table: usuarios
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

-- 2. Table: funcionarios
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

-- 3. Table: herramientas
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

-- 4. Table: prestamos
CREATE TABLE IF NOT EXISTS prestamos (
  id SERIAL PRIMARY KEY,
  codigo_prestamo VARCHAR(30) NOT NULL UNIQUE,
  funcionario_id INT NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  usuario_registro_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  escuela_proyecto VARCHAR(150) NOT NULL,
  fecha_prestamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_devolucion_estimada DATE,
  fecha_devolucion_real TIMESTAMP,
  estado estado_prestamo DEFAULT 'Prestado',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: prestamo_detalles
CREATE TABLE IF NOT EXISTS prestamo_detalles (
  id SERIAL PRIMARY KEY,
  prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  herramienta_id INT NOT NULL REFERENCES herramientas(id) ON DELETE CASCADE,
  estado_entrega condicion_herramienta DEFAULT 'Bueno',
  estado_devolucion condicion_herramienta,
  observaciones TEXT
);

-- 6. Table: devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id SERIAL PRIMARY KEY,
  prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  usuario_registro_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_devolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT
);

-- 7. Table: historial_actividades
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

-- 8. Table: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255)
);
