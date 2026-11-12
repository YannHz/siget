# SIASE — guía para agentes

## Proyecto

SIASE controla el ingreso y salida de dispositivos al campus. Un alumno registra
su equipo y crea una solicitud; el vigilante revisa físicamente el equipo y
escanea el QR estático del dispositivo para registrar el ingreso o la salida.
No implementar funciones de asistencia académica.

## Skills locales

Las skills instaladas viven en `.agents/skills/` y su origen está fijado en
`skills-lock.json`. Antes de usar una, leer por completo su `SKILL.md`.

| Necesidad | Skill preferida |
| --- | --- |
| Diseñar o rehacer UI web React | `design-taste-frontend` |
| Explorar una interfaz o flujo antes de implementarlo | `prototype` |
| Elegir una librería de componentes | `pick-ui-library` |
| Mensajes, confirmaciones y notificaciones | `ask-sonner` |
| Detectar o diseñar microinteracciones | `find-animation-opportunities`, `choreograph` |
| Implementar o mejorar animaciones | `animate`, `improve-animations` |
| Revisar rendimiento de animaciones | `animation-performance` |
| Revisar accesibilidad y diseño de una app nativa | `apple-design` |

Las skills de Swift, Expo o mobile nativo no aplican al frontend actual de
React/Vite salvo que el alcance cambie explícitamente.

## Reglas del flujo de acceso

- El QR es estático y representa únicamente un dispositivo; no contiene datos
  personales ni concede permisos por sí mismo.
- El backend valida la sesión del vigilante, el estado de la solicitud y la
  transición antes de registrar un ingreso o salida.
- Estados válidos: `PENDIENTE → EN_REVISION → EN_CAMPUS → CERRADA`.
- Conservar una auditoría de cambios de estado.

## Calidad mínima

- Para frontend: ejecutar `npm run build` desde `frontend`.
- Para backend: comprobar sintaxis de los JS modificados y no introducir JWT ni
  tokens accesibles desde `localStorage`.
- No modificar `.mysql-data/`; es estado local de MySQL.
