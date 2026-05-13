-- Limpiar datos existentes
TRUNCATE TABLE bienes CASCADE;
TRUNCATE TABLE usuarios CASCADE;
TRUNCATE TABLE categorias CASCADE;
TRUNCATE TABLE dependencias CASCADE;
TRUNCATE TABLE encargados CASCADE;
TRUNCATE TABLE mantenimiento CASCADE;
TRUNCATE TABLE bitacora CASCADE;

-- Usuarios
INSERT INTO usuarios (nombre, usuario, contrasena, rol, activo, fecha_creacion) VALUES
('Admin ULA', 'admin', 'hashed_password_admin', 'admin', true, NOW()),
('Juan Pérez', 'juan', 'hashed_password_juan', 'operador', true, NOW()),
('María García', 'maria', 'hashed_password_maria', 'operador', true, NOW());

-- Dependencias (Ubicaciones)
INSERT INTO dependencias (nombre, descripcion) VALUES
('Departamento de Informática', 'Laboratorios y oficinas de IT'),
('Biblioteca Central', 'Equipo de la biblioteca principal'),
('Rectorado', 'Oficinas administrativas'),
('Taller de Mantenimiento', 'Área de reparación de equipos');

-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES
('Computadoras', 'Laptops y desktops'),
('Impresoras', 'Impresoras y multifuncionales'),
('Proyectores', 'Proyectores y equipos audiovisuales'),
('Servidores', 'Equipos de servidor'),
('Mobiliario', 'Escritorios, sillas, archivos');

-- Encargados
INSERT INTO encargados (nombre, cedula, cargo, telefono, email, id_dependencia) VALUES
('Carlos López', 12345678, 'Técnico IT', '0212-1234567', 'carlos@ula.edu.ve', 1),
('Antonia Díaz', 87654321, 'Bibliotecaria', '0212-7654321', 'antonia@ula.edu.ve', 2),
('Roberto Martínez', 55555555, 'Jefe de Mantenimiento', '0212-5555555', 'roberto@ula.edu.ve', 4);

-- Bienes
INSERT INTO bienes (codigo, nombre, descripcion, categoria_id, encargado_id, operador_id, ubicacion_id, estado_operativo, valor, fecha_registro, fecha_actualizacion, condicion_fisica, activo) VALUES
('COMP-001', 'Laptop Dell XPS 13', 'Procesador Intel i7, 16GB RAM, 512GB SSD', 1, 1, 1, 1, 'En uso', 2500.00, NOW(), NOW(), 'Buen estado', true),
('COMP-002', 'Desktop HP Pavilion', 'Procesador AMD Ryzen 5, 8GB RAM, 256GB SSD', 1, 1, 2, 1, 'En uso', 1200.00, NOW(), NOW(), 'Buen estado', true),
('IMPRE-001', 'Impresora HP LaserJet Pro', 'Impresora láser blanco y negro, 35 ppm', 2, 1, 2, 1, 'En uso', 800.00, NOW(), NOW(), 'Buen estado', true),
('IMPRE-002', 'Multifuncional Canon', 'Impresora, escáner, copiadora a color', 2, 2, 3, 2, 'En uso', 1500.00, NOW(), NOW(), 'Buen estado', true),
('PROY-001', 'Proyector Epson EB-X41', 'Proyector 3LCD, 3600 lumens', 3, 1, 1, 1, 'En uso', 1800.00, NOW(), NOW(), 'Buen estado', true),
('SERV-001', 'Servidor Dell PowerEdge', 'Servidor rack, 2 procesadores Xeon', 4, 3, 1, 1, 'En uso', 8000.00, NOW(), NOW(), 'Buen estado', true),
('MOB-001', 'Escritorio Ejecutivo', 'Escritorio madera, 1.2m x 0.6m', 5, 2, 3, 3, 'En uso', 400.00, NOW(), NOW(), 'Buen estado', true),
('MOB-002', 'Silla Ergonómica', 'Silla giratoria con soporte lumbar', 5, 2, 3, 3, 'En uso', 250.00, NOW(), NOW(), 'Buen estado', true);

-- Mantenimiento (ejemplo)
INSERT INTO mantenimiento (bien_id, fecha_inicio, fecha_fin, trabajo_realizado, proxima_fecha, estado) VALUES
(1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', 'Limpieza de ventiladores y actualización de drivers', NOW() + INTERVAL '3 months', 'Finalizado'),
(3, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', 'Reemplazo de cartucho de tóner', NOW() + INTERVAL '6 months', 'Finalizado');