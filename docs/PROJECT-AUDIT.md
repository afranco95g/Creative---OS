# Auditoria tecnica del proyecto

Fecha: 2026-08-01

## Estado operativo

- Next.js, Vercel y Supabase estan conectados.
- Las rutas publicas, autenticacion, agenda, financiacion, revision editorial
  y gestion del ecosistema tienen puntos de entrada desde la aplicacion.
- El repositorio no contiene pruebas automatizadas.
- El baseline de ESLint contiene advertencias por `any`, imagenes sin optimizar,
  dependencias de hooks y codigo no usado. Ya no bloquean la primera adopcion
  del lint, pero deben reducirse progresivamente.

## Cierre aplicado

### Postulaciones de proyectos

La migracion `022_mvp_project_workflows.sql` implementa:

- `project_applications`
- `submit_project_application`
- `start_project_application_review`
- `review_project_application`
- `list_project_applications_for_review`

- propiedad de proyectos por actor administrado;
- snapshots de postulacion sin grafo ni mensajes;
- RLS de propietario y colas de revision mediante RPC;
- resúmenes editoriales que excluyen columnas privadas.

`020` y `021` permanecen como numeros reservados para no reescribir el
historial de migraciones.

### Perfil interno de personas

`/workspace/ecosystem/people/[id]` solo muestra el identificador. Falta
conectarlo al repositorio de entidades y construir el editor de persona.

### Productor ejecutivo

El chat del Studio usa motores deterministas locales. No existe Route Handler,
Server Action ni cliente de OpenAI conectado. La interfaz funciona, pero no es
una integracion con un modelo externo.

## Codigo no alcanzable

Knip detecto 103 archivos sin entrada desde rutas activas. Los grupos mas
grandes son:

- kernel y sistema generico de entidades;
- motores de conversacion, memoria y curiosidad alternativos;
- componentes antiguos de landing, chat y navegacion;
- framework generico de revisiones;
- configuracion de workspace no usada.

No se eliminaron en bloque porque forman subsistemas coherentes y pueden ser
trabajo futuro. Antes de activarlos se debe elegir una unica arquitectura y
conectar un punto de entrada; si se abandonan, deben borrarse por subsistema,
no archivo por archivo.

## Limpieza aplicada

- Eliminada la copia no usada de `ProjectEditorialForm` en `services/`.
- Eliminados placeholders antiguos de Supabase y OpenAI.
- Eliminados archivos vacios, un typo de `publicFunding` y componentes sin uso.
- Conservadas `020` y `021` como migraciones reservadas e inmutables.
- Eliminada la dependencia `framer-motion`, sin importaciones en el proyecto.
- Anadido `.env.example` y actualizado el README para Vercel/Supabase.

## Conexiones aplicadas

- Creada `/oportunidades/[opportunityId]/postular` para conectar el CTA
  publico con `FundingApplicationManager`.
- Conectados los modulos existentes de agenda, financiacion y revision desde
  `/admin`.

## Siguientes decisiones

1. Aplicar la migracion `022` y ejecutar el plan de pruebas del MVP antes de
   habilitar postulaciones en produccion.
2. Decidir si el sistema generico de entidades reemplaza las pantallas actuales
   o si debe eliminarse.
3. Conectar el editor del perfil interno de personas.
4. Definir si el Productor Ejecutivo seguira siendo local o usara OpenAI desde
   una ruta exclusivamente de servidor.
5. Agregar pruebas de autenticacion, RLS, publicacion, agenda y postulaciones.
