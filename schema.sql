-- SIGET · Esquema canónico de desarrollo y despliegue local.
-- MySQL 8.0+. Es compatible con el backend actual: no requiere migraciones heredadas.
-- Crea una base nueva. Para usarla: DB_NAME=siget en backend/.env.

CREATE DATABASE IF NOT EXISTS siget
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE siget;

CREATE TABLE carreras (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carreras_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE instructor (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE datos_alumnos (
  id INT NOT NULL AUTO_INCREMENT,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  idsenati VARCHAR(20) NOT NULL,
  semestre TINYINT UNSIGNED NOT NULL,
  carrera_id INT NOT NULL,
  instructor_id INT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  password_alumno VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usuario_creacion VARCHAR(50) NULL,
  usuario_modificacion VARCHAR(50) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alumnos_idsenati (idsenati),
  KEY idx_alumnos_estado (estado),
  CONSTRAINT fk_alumnos_carrera FOREIGN KEY (carrera_id) REFERENCES carreras (id),
  CONSTRAINT fk_alumnos_instructor FOREIGN KEY (instructor_id) REFERENCES instructor (id),
  CONSTRAINT chk_alumnos_semestre CHECK (semestre BETWEEN 1 AND 12)
) ENGINE=InnoDB;

CREATE TABLE vigilante (
  id INT NOT NULL AUTO_INCREMENT,
  guardia_id INT NOT NULL,
  usuario VARCHAR(50) NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  turno VARCHAR(50) NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  password_vigilante VARCHAR(255) NOT NULL,
  usuario_creacion VARCHAR(100) NULL,
  usuario_modificacion VARCHAR(100) NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vigilante_guardia_id (guardia_id),
  UNIQUE KEY uq_vigilante_usuario (usuario),
  KEY idx_vigilante_estado (estado)
) ENGINE=InnoDB;

-- Cookie opaca. usuario_id se interpreta junto con rol porque alumno y vigilante
-- pertenecen a tablas separadas y pueden tener el mismo identificador numérico.
CREATE TABLE sesiones (
  id CHAR(43) CHARACTER SET ascii NOT NULL,
  usuario_id INT NOT NULL,
  rol ENUM('alumno', 'vigilante') NOT NULL,
  usuario_codigo VARCHAR(50) NOT NULL,
  expira_en DATETIME NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sesiones_usuario (usuario_id, rol),
  KEY idx_sesiones_expira (expira_en)
) ENGINE=InnoDB;

CREATE TABLE dispositivos_x_alumno (
  id INT NOT NULL AUTO_INCREMENT,
  alumno_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  numero_serie VARCHAR(100) NULL,
  descripcion VARCHAR(500) NULL,
  -- UUID persistente: se codifica en el QR, no contiene datos personales.
  codigo_qr CHAR(36) CHARACTER SET ascii NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usuario_creacion VARCHAR(100) NULL,
  usuario_modificacion VARCHAR(100) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dispositivos_qr (codigo_qr),
  UNIQUE KEY uq_dispositivos_serie (numero_serie),
  KEY idx_dispositivos_alumno_estado (alumno_id, estado),
  CONSTRAINT fk_dispositivos_alumno FOREIGN KEY (alumno_id) REFERENCES datos_alumnos (id)
) ENGINE=InnoDB;

-- 0 = pendiente, 1 = dentro del campus, 2 = salida registrada.
-- Las fechas son DATETIME para conservar la hora exacta de cada movimiento.
CREATE TABLE registro_dispositivo (
  id INT NOT NULL AUTO_INCREMENT,
  estado TINYINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_entrada DATETIME NULL,
  fecha_salida DATETIME NULL,
  alumno_id INT NOT NULL,
  instructor_id INT NOT NULL,
  guardia_id INT NOT NULL,
  objeto_id INT NOT NULL,
  -- Evita duplicados incluso si dos solicitudes llegan al mismo instante.
  solicitud_abierta_objeto INT GENERATED ALWAYS AS (
    CASE WHEN estado IN (0, 1) THEN objeto_id ELSE NULL END
  ) STORED,
  observacion VARCHAR(500) NULL,
  usuario_creacion VARCHAR(100) NULL,
  usuario_modificacion VARCHAR(100) NULL,
  PRIMARY KEY (id),
  KEY idx_registro_estado_fecha (estado, fecha_envio),
  KEY idx_registro_alumno_fecha (alumno_id, fecha_envio),
  KEY idx_registro_objeto_estado (objeto_id, estado),
  UNIQUE KEY uq_registro_solicitud_activa (solicitud_abierta_objeto),
  CONSTRAINT fk_registro_alumno FOREIGN KEY (alumno_id) REFERENCES datos_alumnos (id),
  CONSTRAINT fk_registro_instructor FOREIGN KEY (instructor_id) REFERENCES instructor (id),
  CONSTRAINT fk_registro_guardia FOREIGN KEY (guardia_id) REFERENCES vigilante (id),
  CONSTRAINT fk_registro_objeto FOREIGN KEY (objeto_id) REFERENCES dispositivos_x_alumno (id),
  CONSTRAINT chk_registro_estado CHECK (estado IN (0, 1, 2))
) ENGINE=InnoDB;

-- Datos iniciales locales. Contraseña de ambas cuentas: admin.
-- Hash bcrypt generado con coste 12. Cambiar antes de publicar.
INSERT INTO carreras (id, nombre) VALUES (1, 'Computación e Informática')
  ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
INSERT INTO instructor (id, nombre, apellido) VALUES (1, 'Instructor', 'Local')
  ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellido = VALUES(apellido);
INSERT INTO vigilante (id, guardia_id, usuario, nombre, apellido, turno, password_vigilante, usuario_creacion)
VALUES (1, 999001, 'admin', 'Admin', 'Local', 'Mañana', '$2b$12$9HESLj8bs/WY2hryESUhZeuk7XQo9MTDlbgtPDgREpPsnbe6Dc0NO', 'bootstrap')
ON DUPLICATE KEY UPDATE usuario = VALUES(usuario), password_vigilante = VALUES(password_vigilante), estado = 1;
INSERT INTO datos_alumnos (id, nombres, apellidos, idsenati, semestre, carrera_id, instructor_id, password_alumno, usuario_creacion)
VALUES (1, 'Alumno', 'Local', 'alumno', 1, 1, 1, '$2b$12$9HESLj8bs/WY2hryESUhZeuk7XQo9MTDlbgtPDgREpPsnbe6Dc0NO', 'bootstrap')
ON DUPLICATE KEY UPDATE password_alumno = VALUES(password_alumno), estado = 1;
