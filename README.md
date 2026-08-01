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

La migracion `020_project_applications.sql` esta reservada pero aun no
contiene el esquema requerido. El flujo de postulacion de proyectos no debe
considerarse operativo hasta completar y aplicar esa migracion.
