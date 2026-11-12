-- SIASE: control de ingreso y salida de dispositivos.
-- MySQL 8.0+. Este esquema crea una base nueva; no modifica la base heredada.
-- El QR estático contiene `codigo_qr` del dispositivo. Nunca debe contener datos
-- personales ni permisos de acceso.

CREATE DATABASE IF NOT EXISTS siase_control_acceso
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE siase_control_acceso;

CREATE TABLE carreras (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carreras_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(32) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso_en DATETIME NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_codigo (codigo),
  KEY idx_usuarios_rol_activo (rol, activo)
) ENGINE=InnoDB;

CREATE TABLE instructores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(32) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_instructores_codigo (codigo)
) ENGINE=InnoDB;

-- Sesiones opacas: la cookie contiene solo este identificador, no un JWT.
CREATE TABLE sesiones (
  id CHAR(43) CHARACTER SET ascii NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  rol ENUM('alumno', 'vigilante', 'admin') NOT NULL,
  usuario_codigo VARCHAR(32) NOT NULL,
  expira_en DATETIME NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sesiones_expira_en (expira_en),
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB;

CREATE TABLE alumnos (
  usuario_id BIGINT UNSIGNED NOT NULL,
  carrera_id BIGINT UNSIGNED NOT NULL,
  instructor_id BIGINT UNSIGNED NULL,
  semestre TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (usuario_id),
  KEY idx_alumnos_carrera (carrera_id),
  KEY idx_alumnos_instructor (instructor_id),
  CONSTRAINT fk_alumnos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
  CONSTRAINT fk_alumnos_carrera
    FOREIGN KEY (carrera_id) REFERENCES carreras (id),
  CONSTRAINT fk_alumnos_instructor
    FOREIGN KEY (instructor_id) REFERENCES instructores (id),
  CONSTRAINT chk_alumnos_semestre CHECK (semestre BETWEEN 1 AND 12)
) ENGINE=InnoDB;

CREATE TABLE vigilantes (
  usuario_id BIGINT UNSIGNED NOT NULL,
  turno VARCHAR(50) NOT NULL,
  PRIMARY KEY (usuario_id),
  CONSTRAINT fk_vigilantes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB;

CREATE TABLE dispositivos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  -- UUID generado por la aplicación con crypto.randomUUID(). Se codifica en el QR.
  codigo_qr CHAR(36) CHARACTER SET ascii NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  numero_serie VARCHAR(100) NULL,
  descripcion VARCHAR(500) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dispositivos_codigo_qr (codigo_qr),
  UNIQUE KEY uq_dispositivos_numero_serie (numero_serie),
  UNIQUE KEY uq_dispositivos_id_alumno (id, alumno_id),
  KEY idx_dispositivos_alumno_activo (alumno_id, activo),
  CONSTRAINT fk_dispositivos_alumno
    FOREIGN KEY (alumno_id) REFERENCES alumnos (usuario_id)
) ENGINE=InnoDB;

CREATE TABLE solicitudes_ingreso (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  dispositivo_id BIGINT UNSIGNED NOT NULL,
  estado ENUM('PENDIENTE', 'EN_REVISION', 'EN_CAMPUS', 'CERRADA', 'RECHAZADA', 'CANCELADA')
    NOT NULL DEFAULT 'PENDIENTE',
  observacion_alumno VARCHAR(500) NULL,
  observacion_vigilante VARCHAR(500) NULL,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revisada_en DATETIME NULL,
  ingresada_en DATETIME NULL,
  salida_en DATETIME NULL,
  vigilante_revision_id BIGINT UNSIGNED NULL,
  vigilante_entrada_id BIGINT UNSIGNED NULL,
  vigilante_salida_id BIGINT UNSIGNED NULL,
  -- Solo puede existir una solicitud abierta por dispositivo.
  dispositivo_activo_id BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN estado IN ('PENDIENTE', 'EN_REVISION', 'EN_CAMPUS') THEN dispositivo_id ELSE NULL END
  ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitud_abierta_dispositivo (dispositivo_activo_id),
  KEY idx_solicitudes_panel (estado, creada_en),
  KEY idx_solicitudes_alumno (alumno_id, creada_en),
  KEY idx_solicitudes_dispositivo (dispositivo_id, creada_en),
  CONSTRAINT fk_solicitudes_dispositivo_propietario
    FOREIGN KEY (dispositivo_id, alumno_id) REFERENCES dispositivos (id, alumno_id),
  CONSTRAINT fk_solicitudes_vigilante_revision
    FOREIGN KEY (vigilante_revision_id) REFERENCES vigilantes (usuario_id),
  CONSTRAINT fk_solicitudes_vigilante_entrada
    FOREIGN KEY (vigilante_entrada_id) REFERENCES vigilantes (usuario_id),
  CONSTRAINT fk_solicitudes_vigilante_salida
    FOREIGN KEY (vigilante_salida_id) REFERENCES vigilantes (usuario_id)
) ENGINE=InnoDB;

CREATE TABLE solicitud_eventos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  solicitud_id BIGINT UNSIGNED NOT NULL,
  actor_usuario_id BIGINT UNSIGNED NULL,
  tipo ENUM(
    'SOLICITUD_CREADA', 'REVISION_INICIADA', 'INGRESO_CONFIRMADO',
    'SALIDA_CONFIRMADA', 'RECHAZADA', 'CANCELADA'
  ) NOT NULL,
  estado_anterior VARCHAR(20) NULL,
  estado_nuevo VARCHAR(20) NOT NULL,
  detalle VARCHAR(500) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eventos_solicitud_fecha (solicitud_id, creado_en),
  CONSTRAINT fk_eventos_solicitud
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_ingreso (id),
  CONSTRAINT fk_eventos_actor
    FOREIGN KEY (actor_usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB;

-- Transiciones que el backend debe aplicar dentro de una transacción:
-- PENDIENTE -> EN_REVISION | RECHAZADA | CANCELADA
-- EN_REVISION -> EN_CAMPUS | RECHAZADA
-- EN_CAMPUS -> CERRADA
-- Al escanear: buscar el dispositivo por codigo_qr, bloquear su solicitud abierta
-- con SELECT ... FOR UPDATE, validar el estado y registrar evento + cambio.

-- Credenciales iniciales solo para desarrollo local. Cámbialas antes de publicar.
-- Usuario: admin / Contraseña: admin
INSERT INTO usuarios (codigo, nombres, apellidos, password_hash, rol)
VALUES ('admin', 'Administrador', 'Local', '$2b$12$9HESLj8bs/WY2hryESUhZeuk7XQo9MTDlbgtPDgREpPsnbe6Dc0NO', 'vigilante')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), password_hash = VALUES(password_hash), activo = TRUE;
INSERT INTO vigilantes (usuario_id, turno)
VALUES (LAST_INSERT_ID(), 'Mañana')
ON DUPLICATE KEY UPDATE turno = VALUES(turno);

-- Usuario: alumno / Contraseña: admin
INSERT INTO carreras (nombre) VALUES ('Computación e Informática') ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @carrera_local := LAST_INSERT_ID();
INSERT INTO instructores (codigo, nombres, apellidos) VALUES ('INST-001', 'Instructor', 'Local') ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @instructor_local := LAST_INSERT_ID();
INSERT INTO usuarios (codigo, nombres, apellidos, password_hash, rol)
VALUES ('alumno', 'Alumno', 'Local', '$2b$12$9HESLj8bs/WY2hryESUhZeuk7XQo9MTDlbgtPDgREpPsnbe6Dc0NO', 'alumno')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), password_hash = VALUES(password_hash), activo = TRUE;
INSERT INTO alumnos (usuario_id, carrera_id, instructor_id, semestre)
VALUES (LAST_INSERT_ID(), @carrera_local, @instructor_local, 1)
ON DUPLICATE KEY UPDATE carrera_id = VALUES(carrera_id), instructor_id = VALUES(instructor_id), semestre = VALUES(semestre);
