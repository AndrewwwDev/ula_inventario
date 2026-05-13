CREATE DATABASE ula_inventario;
\c ula_inventario;

-- =======================
-- Tabla de usuarios
-- =======================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'operador',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- =======================
-- Tabla de dependencias
-- =======================
CREATE TABLE dependencias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT
);

-- =======================
-- Tabla de encargados
-- =======================
CREATE TABLE encargados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cedula INT,
    cargo VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    id_dependencia INT REFERENCES dependencias(id) ON DELETE SET NULL
);

-- =======================
-- Tabla de categorías
-- =======================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- =======================
-- Tabla de bienes (inventario principal)
-- =======================
CREATE TABLE bienes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id INT REFERENCES categorias(id),
    encargado_id INT REFERENCES encargados(id),
    operador_id INT REFERENCES usuarios(id),
    ubicacion_id INT REFERENCES dependencias(id),
    estado_operativo VARCHAR(20) DEFAULT 'En uso',
    valor NUMERIC(12,2),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    imagen_url TEXT,
    qr_code TEXT,
    activo BOOLEAN DEFAULT TRUE,
    motivo_desincorporacion TEXT,
    fecha_desincorporacion DATE,
    foto_desincorporacion TEXT,
    condicion_fisica VARCHAR(50) DEFAULT 'Buen estado',
    especificaciones_condicion TEXT
);

-- =======================
-- Tabla de movimientos
-- =======================
CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    id_bien INT REFERENCES bienes(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT NOW(),
    tipo VARCHAR(50) DEFAULT 'Traslado',
    origen_id INT REFERENCES dependencias(id),
    destino_id INT REFERENCES dependencias(id),
    observaciones TEXT,
    id_usuario INT REFERENCES usuarios(id)
);

-- =======================
-- Tabla de mantenimientos
-- =======================
CREATE TABLE mantenimientos (
    id SERIAL PRIMARY KEY,
    bien_id INT REFERENCES bienes(id) ON DELETE CASCADE,
    fecha_inicio DATE,
    fecha_fin DATE,
    trabajo_realizado TEXT,
    proxima_fecha DATE,
    estado VARCHAR(50) DEFAULT 'En Reparación',
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- =======================
-- Tabla de bitacora
-- =======================
CREATE TABLE bitacora (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    accion VARCHAR(100),
    entidad VARCHAR(50),
    entidad_id INT,
    diff_visual JSON,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

-- =======================
-- Tabla de estados operativos
-- =======================
CREATE TABLE estados_operativos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    color VARCHAR(10),
    icono VARCHAR(50)
);

-- =======================
-- Trigger para actualizar fecha de actualización
-- =======================
CREATE OR REPLACE FUNCTION actualizar_fecha_bien()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fecha_bien
BEFORE UPDATE ON bienes
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_bien();

-- =======================
-- Vista para dashboard resumen
-- =======================
CREATE OR REPLACE VIEW vista_resumen_dashboard AS
SELECT
    COUNT(*) AS total_bienes,
    SUM(CASE WHEN estado_operativo = 'En uso' THEN 1 ELSE 0 END) AS en_uso,
    SUM(CASE WHEN estado_operativo = 'Regular' THEN 1 ELSE 0 END) AS regular,
    SUM(CASE WHEN estado_operativo = 'Dañado' THEN 1 ELSE 0 END) AS danado
FROM bienes
WHERE activo = TRUE;
