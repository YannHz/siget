-- Migración para la base heredada `siase`.
-- Aplicada a la base local durante el desarrollo; se conserva para otros entornos.

ALTER TABLE registro_dispositivo
  MODIFY fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY fecha_entrada DATETIME NULL,
  MODIFY fecha_salida DATETIME NULL;

ALTER TABLE vigilante
  ADD COLUMN usuario VARCHAR(50) NULL,
  ADD UNIQUE KEY uq_vigilante_usuario (usuario);

-- Credenciales locales de prueba: admin / admin
INSERT INTO vigilante (
  guardia_id, usuario, nombre, apellido, turno, estado,
  password_vigilante, usuario_creacion, fecha_creacion
)
SELECT 999001, 'admin', 'Admin', 'Local', 'Mañana', 1,
  '$2b$12$9HESLj8bs/WY2hryESUhZeuk7XQo9MTDlbgtPDgREpPsnbe6Dc0NO',
  'bootstrap', NOW()
WHERE NOT EXISTS (SELECT 1 FROM vigilante WHERE usuario = 'admin');
