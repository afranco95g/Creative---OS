# Spec: WorkspaceHome — remover override de isAgency y extraer lecturas/escritura de funders a services/

## 1. Objetivo
Eliminar el `|| true` que fuerza isAgency siempre a verdadero, y mover las
llamadas directas a supabase.from('funders') y supabase.from('course_modules')
fuera del componente, hacia funciones de services/, siguiendo el mismo patron
que ya usa este archivo para services/courses/courseService.

## 2. Por que ahora
Confirmado por lectura literal del archivo (components/WorkspaceHome.tsx,
505 lineas): linea 149 tiene `|| true` con comentario que admite ser un
override de entorno. Lineas 59, 69-74, 127-130 y 87-91 llaman a supabase
directo desde el componente cliente sin capa de servicio, a diferencia de
listCourses (linea 8), que si pasa por services/.

## 3. Archivos
- components/WorkspaceHome.tsx: eliminar linea 149 (`|| true` y su comentario).
  Reemplazar las llamadas directas a supabase.from('funders') (lineas 59,
  69-74, 127-130) por llamadas a las nuevas funciones de servicio. Reemplazar
  la query directa a supabase.from('course_modules') (lineas 87-91) por una
  nueva funcion de services/courses/courseService.
- services/funders/funderService.ts (nuevo): getAgencyFunder(),
  updateFunderServiceCatalog(funderId, catalog).
- services/courses/courseService.ts: agregar getModulesForCourse(courseId)
  (misma forma de retorno que hoy construye el componente en lineas 92-99).

## 4. Fuera de alcance
- El heuristico de nombre "imagine" dentro de isAgency (lineas 144-148,
  ej. name?.toLowerCase().includes('imagine')) NO se toca en esta spec.
  Sigue siendo fragil (compara por texto del nombre en vez de un campo
  explicito de tipo de cuenta) pero cambiarlo puede alterar quien ve hoy
  la seccion de Agencia en produccion. Queda para una decision explicita
  aparte.
- Los 4 links hardcodeados a /cursos/music-business (lineas 169, 183, 285,
  309) NO se tocan en esta spec — requieren decidir primero si existe una
  ruta dinamica por curso.
- No se cambia el comportamiento de que solo cuentas "agencia" vean esta
  seccion, solo se elimina el override que lo rompia.

## 5. Decisiones ya tomadas
isAgency queda como la expresion de las lineas 144-148 sin el `|| true`
final. getAgencyFunder() reproduce exactamente la logica actual (lineas
55-79): primero intenta con el actor activo si existe funder_type ==
'agency' via activeActor, si no, fallback a buscar por nombre ilike
'%Imagine%' limit 1. updateFunderServiceCatalog() reproduce exactamente
el update de las lineas 127-130. getModulesForCourse() reproduce
exactamente el select + order + mapeo de lessonCount de las lineas 87-99.

## 6. Interfaces y contratos
    export async function getAgencyFunder(activeActorId?: string | null): Promise<FunderRecord | null>;
    export async function updateFunderServiceCatalog(funderId: string, catalog: string[]): Promise<void>;
    export async function getModulesForCourse(courseId: string): Promise<CourseModuleWithLessonCount[]>;

FunderRecord y CourseModuleWithLessonCount son los mismos shapes que el
componente ya construye hoy — sin agregar ni quitar campos.

## 7. Tests que van a romperse a proposito
Ninguno existente debería romperse. Es refactor de ubicacion de codigo,
no de comportamiento, salvo por la eliminacion del `|| true` (ver punto 8).

## 8. Criterio de aceptacion verificable
1. npm run typecheck sin errores.
2. npm test todo verde.
3. grep en components/WorkspaceHome.tsx confirma cero apariciones de
   "|| true" y cero apariciones de "supabase.from(" (las llamadas a
   supabase quedan solo dentro de services/).
4. grep confirma que isAgency ahora depende exclusivamente de
   funderData?.funder_type, funderData?.name, activeActor?.type,
   workspace.user?.email, workspace.user?.name — sin ningun termino que
   la fuerce siempre a verdadero.
5. Con una cuenta que no cumpla ninguna de las 5 condiciones de isAgency,
   la seccion de Agencia (lineas 201 y 245) no se renderiza. Esto es un
   cambio de comportamiento visible respecto a hoy — confirmalo con una
   cuenta de prueba antes de mandar a producción.

## 9. Que queda deterministico y por que
Todo: son lecturas/escrituras directas a base de datos movidas de ubicacion,
sin logica nueva de inferencia ni condiciones nuevas.
