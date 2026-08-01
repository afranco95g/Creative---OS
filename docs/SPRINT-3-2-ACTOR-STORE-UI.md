# Sprint 3.2 — Actor Store + Create Actor UI

## Resultado

El Actor Engine ya está conectado a una primera interfaz funcional dentro de `Mi Ecosistema`.

## Flujo disponible

1. El usuario abre `/mi-ecosistema`.
2. La sección `Actor Engine v1` carga los actores guardados localmente.
3. `Crear actor` permite elegir Persona, Espacio, Organización o Financiador.
4. El Kernel crea entidad, versión 1, membresía owner, capacidades y evento de dominio.
5. La interfaz actualiza métricas y muestra la tarjeta del actor.

## Persistencia actual

Los datos se guardan en `localStorage` bajo la llave:

`creative-os-entity-database-v1`

Todavía no se sincronizan entre dispositivos. La conexión a Supabase corresponde al Sprint de persistencia cloud.

## Archivos principales

- `components/ActorEnginePanel.tsx`
- `components/MyEcosystemDashboard.tsx`
- `engines/actorEngine.ts`
- `core/repositories/localEntityRepository.ts`

## Validación

`npm run typecheck` pasó correctamente.

El build de producción no pudo concluir en el entorno de entrega porque Next.js intentó descargar el binario SWC y el servidor respondió 503. No se detectaron errores TypeScript.

## Próximo sprint

Actor Builder v1:

- ruta por actor;
- edición de Identidad;
- edición de Historia;
- cálculo automático de completitud;
- guardado local;
- validaciones visibles.
