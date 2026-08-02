# Pruebas de cierre del MVP

## Preparacion

1. Aplicar las migraciones de `database/` en orden, incluida `022_mvp_project_workflows.sql`.
2. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Crear cuentas separadas con roles `member`, `ecosystem_admin`, `journalist`, `media_admin` y `super_admin`.
4. Usar datos desechables. No ejecutar estas pruebas con proyectos reales.

## Identidades y proyectos

- Registrar una persona, un espacio y una marca u organizacion. Confirmar que
  cada cuenta llega a `/mi-ecosistema` y ve su identidad activa.
- Vincular una segunda identidad mediante una membresia activa. Cambiar de
  identidad y confirmar que la lista de proyectos cambia con ella.
- Crear y sincronizar un proyecto. Abrir otra sesion o navegador, cargarlo y
  confirmar que grafo y mensajes se hidratan sin duplicados.
- Intentar insertar un proyecto con el UUID de una identidad no administrada.
  La base debe rechazarlo.

## Postulacion al ecosistema

- Preparar una postulacion y comprobar que la identidad no se puede cambiar.
- Para productos, comprobar que el precio propuesto sea mayor al mayorista.
- Enviar la postulacion y confirmar `eligibility_requested`.
- Como administrador del ecosistema, revisar la cola. Confirmar que el payload
  no contiene `graph` ni `messages`.
- Solicitar cambios con nota, editar el mismo registro y reenviarlo.
- Aceptar una postulacion y confirmar que el proyecto queda `eligible`.

## Flujo editorial y privacidad

- Como propietario, postular voluntariamente un proyecto elegible al medio.
- Como periodista, iniciar revision. Como `media_admin`, rechazar con nota y
  luego publicar una ficha marcada como lista.
- Verificar que las RPC `list_project_applications_for_review`,
  `list_editorial_project_reviews` y `get_editorial_project_summary` no
  devuelven `graph` ni `messages`.
- Ejecutar una consulta directa a `projects` como revisor sin ser propietario.
  Debe devolver cero filas.

## Validacion local y despliegue

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
```

Después del despliegue, repetir login, cambio de actor, sincronizacion,
postulacion y revision en la URL de produccion de Vercel.
