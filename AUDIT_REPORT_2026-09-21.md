# Auditoría técnica — El Culebreo (delta sobre AUDIT_REPORT.md del 2026-09-09)

Fecha: 2026-09-21 · Alcance: dead code + seguridad, sobre el repo conectado en `C:\Projects\Creative-OS\Cultura-esta\El_Culebreo`, solo lectura. No se aplicó ningún cambio.

Este documento **no repite** lo que ya está bien documentado en `AUDIT_REPORT.md` (12 días atrás). Confirma qué de ahí sigue vigente, qué se resolvió, y qué es nuevo — el repo pasó de 37 a 60 migraciones en ese intervalo, así que hay superficie nueva.

---

## 0. Resumen ejecutivo

- **1 hallazgo crítico del informe anterior se resolvió**: Next.js pasó de `15.0.3` (RCE no autenticado) a `15.5.20`.
- **2 hallazgos altos del informe anterior siguen abiertos y uno de ellos creció**: escrituras cliente→Supabase sin validación (ahora 9 componentes, antes 8) y middleware sin cobertura de los árboles de gestión/revisión (ahora hay 5 árboles nuevos sin cubrir, antes ninguno existía con ese nombre).
- **1 hallazgo nuevo, no crítico pero real**: un script de reset de contraseña con Secret Key de Supabase quedó comiteado a git pese a que su propio comentario dice "NO subir este archivo a git".
- **Código huérfano nuevo, verificado, fuera de la lista `NO BORRAR NUNCA` de `CLAUDE.md`**: 2 componentes y 2 engines con cero referencias en todo el repo.
- No se verificó Supabase Auth/RLS en vivo ni grants de PostgREST — igual que el informe anterior, eso requiere el dashboard de Supabase, no es verificable solo desde el código.

---

## 1. Seguridad

### 🔴→✅ S1 (RESUELTO) — Next.js actualizado

`node_modules/next/package.json` reporta `15.5.20` (el `package.json` sigue fijando `^15.0.3`, pero el lockfile ya instaló el patch). Confirmar que el próximo `npm install` en CI/deploy no vuelva a bajar de versión — considerar fijar `"next": "^15.5.20"` explícito en `package.json` para que el rango no permita retroceder si algún día se reinstala con un lockfile viejo.

### 🟠 S2 (PERSISTE Y CRECIÓ) — Escrituras cliente→Supabase sin validación de payload

9 componentes `'use client'` llaman `supabase.from(...).insert/update` o `.rpc(...)` directo desde el navegador, sin ningún esquema de validación entre el formulario y la base:

`components/admin/BudgetManager.tsx`, `MasterCalendar.tsx`, `ProductReviewManager.tsx`, `ProfileAccessManager.tsx`, `TaxRulesManager.tsx`, `TicketingManager.tsx`, `components/products/ProductOwnerManager.tsx` **(nuevo desde el 09-09)**, `components/projects/BudgetSuggestion.tsx`, `components/projects/EcosystemSignalConsent.tsx`.

Ejemplo concreto — `components/admin/BudgetManager.tsx`, función `create()`:

```ts
// ACTUAL — el payload sale directo del form y viaja tal cual a Supabase
async function create(event: FormEvent) {
  event.preventDefault();
  const payload = {
    project_id: projectId,
    direction: form.direction,       // sin whitelist: cualquier string pasa
    status: form.status,             // el usuario podría forzar 'paid'/'approved' desde el form
    quantity: Number(form.quantity), // sin validar > 0, sin límite
    unit_value: Number(form.unitValue),
    // ...
  };
  const { data, error } = await supabase.from('project_budget_lines').insert(payload).select('*').single();
  // ...
}
```

Esto es justo el tipo de cosa que `CLAUDE.md` ya declara como restricción legal ("Plata, puntajes y consistencia son siempre deterministas y auditables") — hoy no hay un modelo decidiendo, pero tampoco hay nadie validando: el navegador manda lo que sea y RLS es la única barrera.

**Parche recomendado** (patrón a replicar en los 9 componentes — aquí aplicado a `BudgetManager`): mover la escritura a una Server Action o ruta API validada con `zod` (ya está en `dependencies`), y dejar que el componente solo llame a esa ruta.

```ts
// services/admin/budgetLineService.ts (nuevo)
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server'; // el cliente server-side existente

const BudgetLineInput = z.object({
  project_id: z.string().uuid(),
  direction: z.enum(['expense', 'income']),
  category: z.string().min(1).max(80),
  concept: z.string().min(1).max(200),
  quantity: z.number().positive().max(100000),
  unit: z.string().min(1).max(40),
  unit_value: z.number().nonnegative().max(1_000_000_000),
  status: z.enum(['estimated', 'quoted']), // el resto de estados ('approved','paid',...) los mueve el workflow de revisión, no el form
  estimated_date: z.string().date().nullable(),
  provider_name: z.string().max(200).nullable(),
  funding_source: z.string().max(200).nullable(),
});

export async function createBudgetLine(raw: unknown) {
  const input = BudgetLineInput.parse(raw); // lanza si no cumple el esquema
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('project_budget_lines')
    .insert({ ...input, source_suggestion: 'manual' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
```

```ts
// app/api/admin/budget-lines/route.ts (nuevo)
import { NextResponse } from 'next/server';
import { createBudgetLine } from '@/services/admin/budgetLineService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createBudgetLine(body);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
```

```ts
// components/admin/BudgetManager.tsx — reemplaza la llamada directa a supabase
async function create(event: FormEvent) {
  event.preventDefault();
  const res = await fetch('/api/admin/budget-lines', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, direction: form.direction, /* ... */ }),
  });
  const { data, error } = await res.json();
  setMessage(error ?? 'Línea agregada al presupuesto.');
  if (data) { setLines((c) => [data as Line, ...c]); setForm(blank); setOpen(false); }
}
```

El punto clave del parche no es solo "usar zod" — es que **quita el whitelisting de estados válidos del control del formulario** (`status` ya no acepta `'paid'`/`'approved'`/`'executed'` desde el cliente) y mueve la escritura detrás de una ruta server-side, que es donde `services/` ya vive como seam correcto según el propio `AUDIT_REPORT.md` original.

### 🟠 S3 (PERSISTE Y EMPEORÓ) — Middleware no cubre los árboles nuevos de gestión/revisión

`lib/supabase/proxy.ts:38-43` sigue con la misma lista de hace 12 días:

```ts
const protectedPrefixes = ['/admin', '/studio', '/workspace', '/mi-ecosistema'];
```

Desde entonces se agregaron (y confirmé que existen como rutas reales bajo `app/`) 5 árboles de gestión/revisión que **no** están en esa lista: `/gestion-financiacion`, `/gestion-agenda`, `/revision-actores`, `/revision-ecosistema`, `/revision-editorial`. Verifiqué que **hoy cada `page.tsx` de esos árboles sí implementa su propio `canAccessWorkspace()`** (no hay bypass activo ahora mismo), pero eso es exactamente la misma situación de "sin red de seguridad centralizada" que ya señalaba S3 — y la lista de árboles sin cubrir casi se duplicó en menos de dos semanas, lo que sugiere que nadie está actualizando el middleware cuando se agrega un árbol nuevo.

**Parche**:

```ts
// lib/supabase/proxy.ts
const protectedPrefixes = [
  '/admin',
  '/studio',
  '/workspace',
  '/mi-ecosistema',
  '/gestion-financiacion',
  '/gestion-agenda',
  '/revision-actores',
  '/revision-ecosistema',
  '/revision-editorial',
];
```

(`/aplicar` e `/importar-proyecto` los dejé fuera a propósito — por el nombre parecen flujos de entrada para actores externos/no autenticados; confirmar con Andrés si deben ser públicos o también protegidos antes de agregarlos.)

### 🟡 Nuevo — `reset-mi-password.local.js` comiteado a git

El archivo trae en su propio encabezado: *"NO subir este archivo a git. Borrar después de usarlo."* Y sin embargo está trackeado (`git log` lo confirma, commit del 2026-09-16). No expone ningún secreto en texto plano — usa `SUPABASE_SECRET_KEY` vía `process.env` — así que el riesgo no es una fuga de credenciales, es que:
1. Cualquiera con acceso al repo ahora tiene la receta lista para resetear la contraseña de cualquier cuenta, con solo poner el Secret Key en su `.env` local.
2. Es una señal de que el flujo "escribir script de un solo uso → correrlo → borrarlo" no se está siguiendo, lo cual es exactamente el tipo de deriva de proceso que este audit debería atrapar.

**Parche**:
```bash
git rm --cached reset-mi-password.local.js
echo "*.local.js" >> .gitignore
git commit -m "Quitar script de reset de password del repo (usa Secret Key, no debía comitearse)"
```
Si el Secret Key usado con este script en algún momento se filtró o se compartió por un canal no seguro, rotarlo desde el dashboard de Supabase — eso no es verificable desde el repo.

### 🟡 S7 (RECONFIRMADO, sin cambios) — Tablas sin RLS

Revisé las migraciones 038 a 060 (23 migraciones nuevas desde el informe anterior) buscando `ENABLE ROW LEVEL SECURITY` sobre las tablas que S7 ya marcaba sin RLS. Ninguna de las 6 que verifiqué puntualmente (`knowledge_sources`, `knowledge_chunks`, `funding_opportunities`, `funding_applications`, `experience_registrations`, `project_actor_links`) recibió RLS en ese intervalo. `experience_registrations` sigue siendo la más sensible del lote — contiene nombre/email/teléfono de asistentes en texto plano. Este hallazgo sigue sin verificación 100% posible solo desde el código (depende de grants de PostgREST en el proyecto Supabase real), pero el código no muestra ninguna corrección.

---

## 2. Código huérfano

### Confirmados eliminables (cero referencias en todo el repo, fuera de la lista `NO BORRAR NUNCA` de `CLAUDE.md`)

| Archivo | Última vez tocado | Por qué se puede borrar |
|---|---|---|
| `components/LandingScreen.tsx` | 2026-09-10 | `grep` de `LandingScreen` en todo el repo (excluyendo node_modules/.next) solo encuentra su propia definición. No hay ningún `import` ni referencia dinámica por string. |
| `components/OnboardingScreen.tsx` | 2026-09-10 | Mismo caso: cero importadores. |
| `engines/executiveDecisionEngine.ts` | 2026-08-01 | Cero referencias en todo el repo. Es además el archivo sin tocar más antiguo de `engines/` — nadie lo ha vuelto a mirar desde antes de que arrancara el ciclo de specs actual. |
| `engines/producerEngine.ts` | 2026-08-01 | Mismo caso: cero referencias, sin tocar desde el 1 de agosto. |

Antes de borrar: `git log -p --follow <archivo>` para confirmar que no hay una razón documentada en el historial de commits que yo no haya visto, y un `grep` final tuyo por si acaso — mi búsqueda cubrió `app/core/hooks/components/services/engines/features`, pero no re-verifiqué `specs/`, `.claude/` ni comentarios en markdown.

### Ya conocidos y protegidos — NO se listan como huérfanos

`CLAUDE.md` ya documenta que estos están desconectados a propósito y deben conservarse: `components/ProjectPanel.tsx`, `MobileNav.tsx`, `DocumentsPanel.tsx`, `ActorEnginePanel.tsx`, `IppPanel.tsx`, `LogPanel.tsx`, `ChatPanel.tsx`, `app/studio/projects/new/page.tsx`, `features/ecosystem/entities/`. Mi escaneo los detectó con cero referencias también (consistente con lo documentado) — los excluyo de la lista de arriba porque borrarlos violaría una instrucción explícita tuya, no porque el análisis técnico sea distinto.

### Lo que NO alcancé a verificar en esta pasada

`core/`, `hooks/` y `services/` de nivel raíz salieron limpios en el muestreo que hice (sin huérfanos nuevos), pero no bajé a verificar función por función dentro de archivos grandes (p. ej. exports internos no usados dentro de `core/projectEngine.ts`, que si tiene 31 referencias pero podría tener funciones exportadas de más). Tampoco corrí una herramienta como `knip` o `ts-prune` (no están instaladas y no quise instalar paquetes nuevos sin tu visto bueno) — esas herramientas encontrarían exports muertos a nivel de función, no solo de archivo, con más precisión que mi `grep` manual.

Dependencias de `package.json` (`mammoth`, `pdf-parse`, `lucide-react`, `zod`) — las 4 están en uso real, ninguna es huérfana.

---

## 3. Lo que necesito que decidas

1. **¿Aplico el parche de middleware (S3) ahora mismo?** Es un cambio de una línea, bajo riesgo, alto impacto (cierra el gap de "sin red de seguridad centralizada" en 5 árboles). Puedo aplicarlo y dejarlo listo para que corras `npm run typecheck && npm test` antes de comitearlo — o te dejo el diff para que lo apliques tú.
2. **¿`/aplicar` e `/importar-proyecto` deben ser públicos o protegidos?** Necesito esto para saber si los agrego también al middleware o si a propósito son la puerta de entrada de actores externos.
3. **¿Quieres que arme el parche completo de S2 (services/ + ruta API + zod) para los 9 componentes, o prefieres que lo tratemos como una spec en `specs/` y lo pase por el ciclo constructor→auditor** que ya tienen definido en `.claude/agents/`? Dado que toca "plata" y "más de 4 archivos", tu propia tabla de `CLAUDE.md` lo clasifica como camino **Completo**, no rápido.
4. **¿Borro los 4 archivos huérfanos confirmados** (`LandingScreen.tsx`, `OnboardingScreen.tsx`, `executiveDecisionEngine.ts`, `producerEngine.ts`) **o los dejo para que los revises tú primero** con el `git log -p` que sugerí arriba?
5. **¿Corro `reset-mi-password.local.js` fuera del repo alguna vez con datos reales de producción?** Si sí, dime si hace falta rotar el Secret Key usado — eso no lo puedo saber desde el código.
