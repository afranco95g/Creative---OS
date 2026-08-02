# Creative OS

Aplicacion Next.js para gestionar proyectos, actores, experiencias,
publicaciones y oportunidades del ecosistema Cultura Esta.

## Desarrollo local

Requiere Node.js y un proyecto de Supabase con las migraciones de
`database/` aplicadas en orden.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Configura en `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Validacion

```powershell
npm run typecheck
npm run build
```

## Despliegue

El repositorio esta conectado a Vercel. Las variables de Supabase deben
existir en los entornos Production y Preview de Vercel. Cada cambio en
`main` genera un despliegue de produccion.

## Base de datos

Aplica las migraciones de `database/` en orden. `020` y `021` son numeros
reservados; `022_mvp_project_workflows.sql` incorpora propiedad de proyectos
por actor, postulaciones seguras y RPCs editoriales que no exponen el grafo ni
los mensajes privados.

Antes de desplegar una version que use estos flujos, ejecuta `022` en el SQL
Editor de Supabase y valida los escenarios de [docs/MVP-TESTING.md](docs/MVP-TESTING.md).
