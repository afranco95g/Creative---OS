# Plataforma de superadministracion

## Auditoria de la arquitectura existente

La implementacion conserva las fuentes de verdad actuales:

- `profiles`: autenticacion, rol y estado de cuenta.
- `people`, `spaces`, `funders`: identidades administrables.
- `projects`: proyecto privado con `graph` y `messages`.
- `project_applications`: resumen voluntario para revision; no expone conversaciones.
- `experiences`: agenda y operacion de actividades.
- `experience_registrations`: inscripciones y entradas de acceso.
- `editorial_posts`: CMS del medio.
- `WorkspaceStore`: estado de trabajo local del usuario, nunca fuente de inteligencia administrativa.

Antes de las migraciones 026 y 027 no existian auditoria transversal, senales consentidas,
productos operativos, tipos de ticket comerciales, presupuesto tabular ni reglas tributarias
versionadas. El panel `/admin` era un indice editorial y su acceso dependia de permisos del CMS.

## Permisos

| Rol | Alcance |
| --- | --- |
| `super_admin` | Direccion completa, roles, auditoria y configuracion. |
| `ecosystem_admin` | Aplicaciones, actores, agenda, experiencias e inteligencia agregada. |
| `media_admin` | CMS, portada, multimedia y publicacion editorial. |
| `journalist` | Borradores, multimedia y revision editorial permitida. |
| `finance_admin` | Reglas, presupuestos y reportes financieros autorizados. |
| `member` | Datos y operaciones propias protegidas por RLS. |

Los campos `profiles.role` y `profiles.is_active` estan protegidos por trigger. Solo
`manage_profile_access` puede administrarlos, exige motivo y produce auditoria inmutable.

## Modelo de senales

`ecosystem_signals` almacena un resumen de hasta 500 caracteres, tema normalizado,
categoria, tipo, territorio, etapa, urgencia, confianza y alcance de consentimiento.
No almacena mensajes, documentos, tareas, riesgos, presupuesto ni fragmentos extensos.

- `aggregate`: solo participa en tendencias anonimizadas.
- `identified`: conserva consentimiento para usos identificados futuros, pero no se expone
  mediante la consulta agregada.
- `revoke_ecosystem_signal`: retira el consentimiento.
- `get_ecosystem_signal_trends`: exige rol autorizado y al menos tres cuentas distintas.

## Modelo financiero

- `products`: catalogo propiedad de un actor, con precio comercial/mayorista, capacidad,
  logistica, restricciones, documentacion y cola de validacion.
- `experience_products`: relacion comercial explicita. Patrocinio, canje, venta, muestra y
  alianza no se mezclan.
- `commercial_policies`: politicas configurables, incluida
  `maximum_product_share_percent`, por alcance y vigencia.
- `ticket_types`: capacidad, disponibilidad y desglose de cada componente del precio.
- `project_budget_lines`: ingreso/egreso, cantidades, impuestos, fuentes, estado y soportes.
- `financial_scenarios`: conservador, base y optimista; la RPC devuelve punto de equilibrio,
  ingreso bruto y estimacion neta con advertencia obligatoria.

El margen bruto de producto nunca se denomina utilidad neta. Los valores calculados son
estimaciones y no registros contables definitivos.

## Modelo tributario

`tax_rules` versiona codigo, jurisdiccion, operacion, CIIU, tercero, responsabilidad,
concepto, tarifa, base, tratamiento, vigencia, fuente oficial, referencia legal,
interpretacion y fecha de consulta. Toda regla nace en `draft` y requiere activacion humana.

La interfaz muestra siempre: "Estimacion tributaria. Validar con contador o asesor tributario".

Fuentes primarias consultadas el 2026-08-01:

- DIAN, Estatuto Tributario compilado: https://normograma.dian.gov.co/dian/compilacion/docs/estatuto_tributario.htm
- DIAN, indice del Estatuto Tributario: https://normograma.dian.gov.co/dian/compilacion/docs/paneles/estatuto_tributario_indice.html
- Funcion Publica, Ley 1493 de 2011: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=45246
- Ministerio de Cultura, espectaculos publicos: https://teatroycirco.mincultura.gov.co/Paginas/Ley-de-espectaculos-publicos.aspx

No se incluyeron tarifas activas precargadas. ICA requiere fuente municipal vigente y la
calificacion tributaria de cada operacion requiere revision profesional.

## Orden de instalacion

Ejecutar en Supabase SQL Editor, en este orden:

1. `database/026_superadmin_foundation.sql`
2. `database/027_financial_operations_foundation.sql`

Despues desplegar el commit correspondiente en Vercel.

## Prueba de aceptacion de esta entrega

1. Iniciar sesion como `super_admin` y abrir `/admin`.
2. Confirmar que un periodista solo ve herramientas editoriales.
3. Abrir `/admin/configuracion`, cambiar un rol con motivo y verificar `/admin/auditoria`.
4. Confirmar que un miembro no puede cambiar su propio rol mediante Supabase.
5. Abrir `/admin/inteligencia`; con menos de tres participantes no debe mostrar tendencias.
6. Crear senales consentidas desde la RPC `share_ecosystem_signal` y verificar el umbral.
7. Abrir `/admin/configuracion/reglas-tributarias`, crear un borrador con fuente oficial y
   comprobar que no queda activo automaticamente.
8. Ejecutar `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet` y `npm.cmd run build`.

## Limites pendientes

- La pasarela de pago, devoluciones monetarias y conciliacion bancaria no estan integradas.
- No se cargan tarifas tributarias sin validacion profesional.
- La exportacion XLSX/PDF y el calendario maestro multivista requieren una fase adicional.
- La interfaz de presupuesto y ticketing sobre las tablas 027 requiere completarse antes de
  declarar esos modulos listos para beta.
- Las migraciones historicas concedieron a `media_admin` acceso operativo en algunas RPC de
  agenda y financiacion. Deben endurecerse con una migracion de compatibilidad antes de beta.
