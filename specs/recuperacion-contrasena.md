# Spec: Recuperación de contraseña

## 1. Objetivo

Construir el flujo completo de "olvidé mi contraseña": enlace visible en
`/login`, página para solicitar el correo de recuperación, y página para
establecer la contraseña nueva cuando el usuario vuelve desde ese correo.

## 2. Por qué ahora

Hoy no existe ningún camino para recuperar el acceso a una cuenta. No hay
botón "olvidé mi contraseña" en `/login`, no hay página que llame a
`supabase.auth.resetPasswordForEmail`, y no hay página que reciba la vuelta
del correo de recuperación y llame a `supabase.auth.updateUser({ password })`.
Como no existe `redirectTo` en ningún lugar del código, cualquier correo de
recuperación que Supabase logre enviar (por ejemplo, disparado a mano desde el
dashboard de Supabase) cae al "Site URL" configurado en el proyecto de
Supabase, que hoy es la página principal — de ahí que el usuario reporte que
el enlace del correo lo manda al home del medio en lugar de a un formulario
de cambio de contraseña.

## 3. Archivos que se crean o se modifican

- **Se crea** `app/olvide-password/page.tsx`: formulario de un solo campo
  (correo). Al enviar, llama a `supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/restablecer-password` })`. Muestra
  siempre el mismo mensaje de confirmación genérico, exista o no esa cuenta
  (ver sección 5, no enumerar usuarios). Reutiliza la estructura visual de
  `app/login/page.tsx` (mismo layout de `<main>`/`<section>`, mismos tokens de
  color, mismo `ThemeToggle`, mismo link "← Volver a El Culebreo").

- **Se crea** `app/restablecer-password/page.tsx`: página que el usuario ve al
  volver del correo. Suscribe `supabase.auth.onAuthStateChange` y espera el
  evento `PASSWORD_RECOVERY` para habilitar el formulario de "contraseña
  nueva" + "confirmar contraseña nueva". Si el evento no llega (enlace roto,
  ya usado, o expirado — Supabase por defecto vence el enlace de recuperación
  a la hora) y tampoco hay sesión activa después de esperar la resolución
  inicial de `onAuthStateChange`, muestra un estado de error explícito con un
  link a `/olvide-password` para pedir uno nuevo. Al enviar el formulario
  válido, llama a `supabase.auth.updateUser({ password })`, luego
  `supabase.auth.signOut()`, y redirige con `router.replace('/login?reset=1')`.
  Reutiliza la misma estructura visual que `app/login/page.tsx`.

- **Se modifica** `app/login/page.tsx`:
  - Se agrega un link "¿Olvidaste tu contraseña?" que navega a
    `/olvide-password`, ubicado debajo del campo de contraseña y antes (o al
    lado) del botón de submit.
  - Se agrega lectura de `searchParams.get('reset')`: si es `'1'`, se muestra
    un mensaje de confirmación ("Tu contraseña fue actualizada. Ingresa con
    tu contraseña nueva.") arriba del formulario, con la misma clase visual
    que ya usan los mensajes de estado en esa página (no la caja de error
    roja — ese estilo es solo para errores, ver convención de color de
    `CLAUDE.md`; usar `border-borde bg-superficie-elevada text-texto-largo`
    para este mensaje de confirmación, no `bg-rojo-base`).

## 4. Fuera de alcance

- Cualquier cambio a la plantilla de correo de recuperación dentro del
  dashboard de Supabase — eso es configuración externa, no código. Se deja
  nota para el dueño del proyecto en el reporte final: hay que confirmar en
  el dashboard de Supabase (Authentication → URL Configuration) que
  `{origin}/restablecer-password` esté en la lista de "Redirect URLs"
  permitidas, o Supabase rechazará el `redirectTo` silenciosamente y volverá
  a mandar al Site URL por defecto.
- Cambiar la contraseña estando ya autenticado (flujo típico de
  "configuración de cuenta"). No existe hoy una página de configuración de
  cuenta en el ecosistema; no se crea una en esta entrega.
- Rate limiting propio sobre `/olvide-password` — Supabase ya aplica límites
  de envío de correo por proyecto; no se duplica esa lógica en la app.
- Validación de fortaleza de contraseña más allá del mínimo de caracteres ya
  usado en `/registro`.

## 5. Decisiones ya tomadas

- **No enumerar usuarios**: `/olvide-password` muestra el mismo mensaje de
  éxito sin importar si `resetPasswordForEmail` devuelve error o no (excepto
  errores de formato de correo vacío/inválido en el propio input, que sí se
  muestran, porque no revelan si la cuenta existe). No se distingue en la UI
  "correo no encontrado" de "correo enviado".
- **Longitud mínima de contraseña nueva**: 8 caracteres, igual que
  `app/registro/page.tsx:214` (`password.length < 8`), para mantener la misma
  regla en todo el sistema.
- **Confirmación de contraseña**: el formulario de `/restablecer-password`
  pide la contraseña dos veces y valida que coincidan antes de llamar a
  `updateUser`, igual que ya hace `/registro`.
- **Redirect tras éxito**: a `/login?reset=1`, no directo a `/studio`. Aunque
  `updateUser` dentro de una sesión de recuperación deja una sesión activa,
  se cierra esa sesión explícitamente (`signOut`) y se pide login normal, para
  no dejar sesiones de recuperación abiertas más tiempo del necesario.
- **Nombres de ruta**: `/olvide-password` (solicitar) y
  `/restablecer-password` (establecer la nueva), ambas en español para
  mantener consistencia con `/registro`, `/mi-ecosistema`, etc.
- **Detección del estado "listo para cambiar contraseña"**: únicamente el
  evento `PASSWORD_RECOVERY` de `onAuthStateChange`. No se usa lectura manual
  de `access_token`/`code` desde la URL — el cliente de Supabase
  (`@supabase/ssr`, flujo PKCE por defecto) ya hace el intercambio
  automáticamente al montar la página y dispara ese evento.
- **Mensaje de enlace inválido/expirado**: texto fijo, sin intentar distinguir
  "ya usado" de "expirado" de "manipulado" — Supabase no siempre distingue
  esos casos en la respuesta, y no vale la pena adivinar.

## 6. Interfaces y contratos que hay que respetar

- `supabase.auth.resetPasswordForEmail(email: string, options?: { redirectTo?:
  string }): Promise<{ data; error }>` — API de `@supabase/supabase-js`, sin
  cambios.
- `supabase.auth.onAuthStateChange((event, session) => void)` — ya en uso en
  `components/workspace/WorkspaceAuthBridge.tsx`; el evento nuevo a manejar es
  `'PASSWORD_RECOVERY'`, que esa librería ya emite, no hay que agregarlo.
- `supabase.auth.updateUser({ password: string }): Promise<{ data; error }>` —
  sin cambios.
- El cliente de Supabase a usar es el mismo `supabase` exportado desde
  `lib/supabase/client.ts` (`createBrowserClient`) que ya usan `app/login/page.tsx`
  y `app/registro/page.tsx` — no se crea un cliente nuevo.
- `middleware.ts` / `lib/supabase/proxy.ts`: `/olvide-password` y
  `/restablecer-password` no están en `protectedPrefixes`
  (`/admin`, `/studio`, `/workspace`, `/mi-ecosistema`), así que no requieren
  cambios ahí — confirmar que ninguna de las dos rutas nuevas empiece con esos
  prefijos (no lo hacen).

## 7. Tests que van a romperse a propósito

Ninguno. No hay tests existentes que cubran `/login`, `/registro`, ni el
flujo de autenticación de Supabase — la suite de 10 grupos de `npm test`
documentada en `CLAUDE.md` es sobre los motores de interpretación de
proyectos, no sobre autenticación. No se agregan tests nuevos en esta entrega
porque no hay infraestructura de test para páginas Next.js con Supabase en
este repo hoy (fuera de alcance introducirla aquí).

## 8. Criterio de aceptación verificable

- `npm run typecheck` limpio.
- `app/olvide-password/page.tsx` existe, exporta un componente de página, y
  contiene una llamada a `supabase.auth.resetPasswordForEmail` con un objeto
  `redirectTo` que apunta a `/restablecer-password`.
- `app/restablecer-password/page.tsx` existe, contiene una suscripción a
  `supabase.auth.onAuthStateChange` que reacciona al string literal
  `'PASSWORD_RECOVERY'`, y contiene una llamada a `supabase.auth.updateUser`
  con un objeto que incluye `password`.
- `app/login/page.tsx` contiene un `<Link>` (o `<a>`) cuyo `href` es
  `/olvide-password`.
- Verificación manual (no automatizable sin credenciales de Supabase, se
  reporta como paso manual en el entregable): navegar a `/login`, click en el
  link nuevo, llegar a `/olvide-password`, enviar un correo real de una cuenta
  de prueba, confirmar en la bandeja que el enlace del correo apunta a
  `.../restablecer-password?...` (no a la home), completar el cambio de
  contraseña, confirmar que cae en `/login?reset=1` con el mensaje de
  confirmación visible, y que el login con la contraseña nueva funciona.
- Ningún color crudo nuevo introducido (grep de `#[0-9a-fA-F]{3,6}`,
  `text-white`, `bg-black` sin `/`, `red-[0-9]`, `neutral-` en los tres
  archivos tocados/creados debe dar 0 resultados) — las páginas nuevas deben
  usar exclusivamente los tokens listados en `CLAUDE.md`.

## 9. Qué queda determinista y por qué

Todo el flujo es determinista: no hay interpretación de texto libre, no hay
modelo de lenguaje involucrado, no se decide nada por reglas heurísticas. Las
únicas decisiones son validaciones de formulario (longitud de contraseña,
coincidencia de confirmación) y el enrutamiento fijo entre tres páginas. No
toca plata, puntajes ni el motor de interpretación de proyectos — no aplica
la restricción de auditabilidad de esa sección más allá de lo ya determinista
por construcción.
