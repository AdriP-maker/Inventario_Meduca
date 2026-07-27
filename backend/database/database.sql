-- Database Schema for MEDUCA Coclé - Sistema de Control de Préstamo de Herramientas
CREATE DATABASE IF NOT EXISTS `meduca_inventory` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `meduca_inventory`;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS `historial_actividades`;
DROP TABLE IF EXISTS `devoluciones`;
DROP TABLE IF EXISTS `prestamo_detalles`;
DROP TABLE IF EXISTS `prestamos`;
DROP TABLE IF EXISTS `herramientas`;
DROP TABLE IF EXISTS `funcionarios`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `configuracion`;

-- 1. Table: usuarios
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('Administrador', 'Supervisor', 'Operador') NOT NULL DEFAULT 'Administrador',
  `estado` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: funcionarios
CREATE TABLE `funcionarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cedula` VARCHAR(20) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `cargo` VARCHAR(100) NOT NULL,
  `departamento` VARCHAR(100) NOT NULL DEFAULT 'Mantenimiento',
  `telefono` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: herramientas
CREATE TABLE `herramientas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(30) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `marca` VARCHAR(100) NOT NULL,
  `modelo` VARCHAR(100) DEFAULT NULL,
  `numero_serie` VARCHAR(100) DEFAULT NULL,
  `stock_total` INT NOT NULL DEFAULT 1,
  `stock_disponible` INT NOT NULL DEFAULT 1,
  `stock_prestado` INT NOT NULL DEFAULT 0,
  `stock_danado` INT NOT NULL DEFAULT 0,
  `estado` ENUM('Disponible', 'Prestado', 'Mantenimiento', 'Dañado') NOT NULL DEFAULT 'Disponible',
  `ubicacion` VARCHAR(100) DEFAULT 'Bodega Mantenimiento',
  `foto_url` TEXT DEFAULT NULL,
  `observaciones` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: prestamos
CREATE TABLE `prestamos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_prestamo` VARCHAR(30) NOT NULL UNIQUE,
  `funcionario_id` INT NOT NULL,
  `usuario_registro_id` INT NOT NULL,
  `escuela_proyecto` VARCHAR(150) NOT NULL,
  `fecha_prestamo` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion_estimada` DATE DEFAULT NULL,
  `fecha_devolucion_real` DATETIME DEFAULT NULL,
  `estado` ENUM('Prestado', 'Devuelto', 'Vencido', 'Cancelado') NOT NULL DEFAULT 'Prestado',
  `observaciones` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_prestamos_funcionario` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prestamos_usuario` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: prestamo_detalles
CREATE TABLE `prestamo_detalles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `prestamo_id` INT NOT NULL,
  `herramienta_id` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `estado_entrega` ENUM('Bueno', 'Regular', 'Excelente') NOT NULL DEFAULT 'Bueno',
  `estado_devolucion` ENUM('Bueno', 'Regular', 'Excelente', 'Con Daño') DEFAULT NULL,
  `observaciones` TEXT DEFAULT NULL,
  CONSTRAINT `fk_detalles_prestamo` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalles_herramienta` FOREIGN KEY (`herramienta_id`) REFERENCES `herramientas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: devoluciones
CREATE TABLE `devoluciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `prestamo_id` INT NOT NULL,
  `usuario_registro_id` INT NOT NULL,
  `fecha_devolucion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` TEXT DEFAULT NULL,
  CONSTRAINT `fk_devoluciones_prestamo` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_devoluciones_usuario` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: notas_dano (Oficial MEDUCA)
CREATE TABLE `notas_dano` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_nota` VARCHAR(30) NOT NULL UNIQUE,
  `prestamo_id` INT NOT NULL,
  `funcionario_id` INT NOT NULL,
  `herramienta_id` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `descripcion_dano` TEXT NOT NULL,
  `estado_evaluacion` ENUM('Pendiente Evaluación', 'En Reparación', 'Cambio Solicitado', 'Descarte / Baja') NOT NULL DEFAULT 'Pendiente Evaluación',
  `usuario_registro_id` INT DEFAULT NULL,
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notas_prestamo` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notas_funcionario` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notas_herramienta` FOREIGN KEY (`herramienta_id`) REFERENCES `herramientas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: historial_actividades
CREATE TABLE `historial_actividades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT DEFAULT NULL,
  `usuario_nombre` VARCHAR(100) NOT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `entidad` VARCHAR(50) NOT NULL,
  `entidad_id` INT DEFAULT NULL,
  `detalle` TEXT NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: configuracion
CREATE TABLE `configuracion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clave` VARCHAR(100) NOT NULL UNIQUE,
  `valor` TEXT NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data: Usuarios (password: admin123)
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `email`, `password_hash`, `rol`, `estado`) VALUES
(1, 'Carlos Admin', 'admin', 'carlos.admin@meduca.gob.pa', '$2y$10$L6xQ53ttMr9Q9pnqeRjZOuF2UBZ2viKFafJ4Rg3AVIo0pv7AsL7oe', 'Administrador', 'Activo');

-- Seed Data: Funcionarios
INSERT INTO `funcionarios` (`id`, `cedula`, `nombre`, `apellido`, `cargo`, `departamento`, `telefono`, `email`) VALUES
(1, '2-710-1234', 'Juan', 'Pérez', 'Técnico Electricista', 'Mantenimiento - Electricidad', '6501-1122', 'juan.perez@meduca.gob.pa'),
(2, '2-715-5678', 'Luis', 'González', 'Técnico de Mantenimiento', 'Mantenimiento General', '6502-3344', 'luis.gonzalez@meduca.gob.pa'),
(3, '2-720-9988', 'Pedro', 'Rodríguez', 'Técnico General', 'Mantenimiento General', '6503-5566', 'pedro.rodriguez@meduca.gob.pa'),
(4, '2-705-4433', 'Miguel', 'Sánchez', 'Técnico Electricista', 'Mantenimiento - Electricidad', '6504-7788', 'miguel.sanchez@meduca.gob.pa'),
(5, '2-712-8811', 'Andrés', 'Ortega', 'Técnico de Refrigeración', 'Mantenimiento - Refrigeración', '6505-9900', 'andres.ortega@meduca.gob.pa'),
(6, '2-708-2233', 'Carlos', 'Mendoza', 'Técnico General', 'Mantenimiento General', '6506-1133', 'carlos.mendoza@meduca.gob.pa'),
(7, '2-719-4455', 'Ana', 'Martínez', 'Electricista', 'Mantenimiento - Electricidad', '6507-2244', 'ana.martinez@meduca.gob.pa');

-- Seed Data: Herramientas
INSERT INTO `herramientas` (`id`, `codigo`, `nombre`, `marca`, `modelo`, `numero_serie`, `estado`, `ubicacion`, `foto_url`, `observaciones`) VALUES
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

-- Seed Data: Préstamos Activos
INSERT INTO `prestamos` (`id`, `codigo_prestamo`, `funcionario_id`, `usuario_registro_id`, `escuela_proyecto`, `fecha_prestamo`, `fecha_devolucion_estimada`, `estado`, `observaciones`) VALUES
(1, 'PRE-2025-001', 1, 1, 'Escuela José María La Vega', '2025-05-20 08:30:00', '2025-05-27', 'Prestado', 'Reparación de sistema eléctrico de aulas 1 a 4'),
(2, 'PRE-2025-002', 2, 1, 'C.E.B.G. Ricardo Miró', '2025-05-20 09:15:00', '2025-05-25', 'Prestado', 'Instalación de estructuras metálicas'),
(3, 'PRE-2025-003', 3, 1, 'Escuela de El Copé', '2025-05-21 10:00:00', '2025-05-28', 'Prestado', 'Mantenimiento de techado de gimnasio'),
(4, 'PRE-2025-004', 4, 1, 'Proyecto: Mejora de Aulas - Penonomé', '2025-05-22 11:20:00', '2025-05-29', 'Prestado', 'Medición de carga panel principal'),
(5, 'PRE-2025-005', 5, 1, 'C.E.B.G. Pablo Neruda', '2025-05-22 14:00:00', '2025-05-26', 'Prestado', 'Revisión y carga de gas en acondicionadores de aire');

-- Seed Data: Detalles de Préstamo
INSERT INTO `prestamo_detalles` (`prestamo_id`, `herramienta_id`, `estado_entrega`, `observaciones`) VALUES
(1, 1, 'Excelente', 'Se entrega con brocas'),
(2, 2, 'Bueno', 'Con disco de corte instalado'),
(3, 3, 'Bueno', 'Zapatas antideslizantes comprobadas'),
(4, 4, 'Excelente', 'Puntas de prueba integradas'),
(5, 5, 'Bueno', 'Mangueras azul y roja probadas');

-- Seed Data: Préstamo Devuelto Recientemente
INSERT INTO `prestamos` (`id`, `codigo_prestamo`, `funcionario_id`, `usuario_registro_id`, `escuela_proyecto`, `fecha_prestamo`, `fecha_devolucion_estimada`, `fecha_devolucion_real`, `estado`, `observaciones`) VALUES
(6, 'PRE-2025-000', 6, 1, 'Escuela El Churuquita Grande', '2025-05-15 08:00:00', '2025-05-19', '2025-05-19 16:30:00', 'Devuelto', 'Ajuste general de mobiliario escolar');

INSERT INTO `prestamo_detalles` (`prestamo_id`, `herramienta_id`, `estado_entrega`, `estado_devolucion`, `observaciones`) VALUES
(6, 6, 'Excelente', 'Excelente', 'Devuelto completo en su estuche original');

INSERT INTO `devoluciones` (`id`, `prestamo_id`, `usuario_registro_id`, `fecha_devolucion`, `observaciones`) VALUES
(1, 6, 1, '2025-05-19 16:30:00', 'Herramienta devuelta en óptimas condiciones por Carlos Mendoza');

-- Seed Data: Historial de Actividades (Audit Log)
INSERT INTO `historial_actividades` (`usuario_id`, `usuario_nombre`, `accion`, `entidad`, `entidad_id`, `detalle`, `fecha`) VALUES
(1, 'Carlos Admin', 'Inicio de Sesión', 'Auth', 1, 'Usuario Administrador inició sesión', '2025-05-22 08:00:00'),
(1, 'Carlos Admin', 'Nuevo Préstamo', 'Prestamos', 5, 'Se registró el préstamo PRE-2025-005 para Andrés Ortega (C.E.B.G. Pablo Neruda)', '2025-05-22 14:00:00'),
(1, 'Carlos Admin', 'Nuevo Préstamo', 'Prestamos', 4, 'Se registró el préstamo PRE-2025-004 para Miguel Sánchez (Proyecto Mejora de Aulas)', '2025-05-22 11:20:00'),
(1, 'Carlos Admin', 'Devolución', 'Devoluciones', 1, 'Devolución registrada para préstamo PRE-2025-000', '2025-05-19 16:30:00'),
(1, 'Carlos Admin', 'Creación Herramienta', 'Herramientas', 6, 'Herramienta HER-006 (Juego de Destornilladores Stanley) agregada', '2025-05-15 07:45:00');

-- Seed Data: Configuración del Sistema
INSERT INTO `configuracion` (`clave`, `valor`, `descripcion`) VALUES
('sistema_nombre', 'Sistema de Control de Préstamo de Herramientas', 'Nombre público del sistema'),
('institucion_nombre', 'MEDUCA Coclé - Departamento de Mantenimiento', 'Institución responsable'),
('version', '1.0.0', 'Versión instalada'),
('contacto_soporte', 'soporte.cocle@meduca.gob.pa', 'Correo de soporte técnico'),
('dias_max_prestamo', '7', 'Días máximos de préstamo por defecto');
