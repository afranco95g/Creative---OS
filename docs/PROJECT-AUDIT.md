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

## Bloqueos criticos

### Postulaciones de proyectos

`ProjectApplicationDialog` y `projectApplicationService` usan una tabla y
cuatro RPC que no existen en las migraciones:

- `project_applications`
- `submit_project_application`
- `start_project_application_review`
- `review_project_application`
- `list_project_applications_for_review`

La migracion `database/020_project_applications.sql` esta vacia. El flujo no
puede funcionar contra una base creada exclusivamente desde este repositorio
hasta definir y aplicar ese contrato, incluyendo RLS y permisos.

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
- Eliminada la migracion vacia `021`, que no tenia consumidores.
- Eliminada la dependencia `framer-motion`, sin importaciones en el proyecto.
- Anadido `.env.example` y actualizado el README para Vercel/Supabase.

## Conexiones aplicadas

- Creada `/oportunidades/[opportunityId]/postular` para conectar el CTA
  publico con `FundingApplicationManager`.
- Conectados los modulos existentes de agenda, financiacion y revision desde
  `/admin`.

## Siguientes decisiones

1. Implementar y probar la migracion `020` antes de habilitar postulaciones de
   proyectos en produccion.
2. Decidir si el sistema generico de entidades reemplaza las pantallas actuales
   o si debe eliminarse.
3. Conectar el editor del perfil interno de personas.
4. Definir si el Productor Ejecutivo seguira siendo local o usara OpenAI desde
   una ruta exclusivamente de servidor.
5. Agregar pruebas de autenticacion, RLS, publicacion, agenda y postulaciones.
