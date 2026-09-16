# Spec: WorkspaceHome — saludo con el nombre real del usuario en vez de "Imagine" fijo

## 1. Objetivo
Reemplazar el texto fijo "Hola, Imagine." por el nombre real de quien inicio
sesion, usando la variable que el archivo ya tiene disponible para esto.

## 2. Por que ahora
Confirmado por lectura literal (components/WorkspaceHome.tsx, lineas 118-150):
el header con "Hola, Imagine." (linea 133) no tiene ningun condicional
isAgency envolviendolo — se renderiza para cualquier usuario de /studio, y
hoy todos ven el nombre de Imagine sin importar quien sean. workspace.user?.name
(prop workspace: WorkspaceState, ya usada en la expresion de isAgency, linea 107)
es el campo correcto: es el nombre de quien esta autenticado, no el de un
funder especifico.

## 3. Archivos
- components/WorkspaceHome.tsx: linea 133 unicamente.

## 4. Fuera de alcance
- No se toca isAgency ni su expresion (lineas 102-107).
- No se toca ningun otro texto del header (lineas 118-150) salvo la linea 133.
- No se agrega ningun campo nuevo a WorkspaceState ni a ningun tipo.

## 5. Decisiones ya tomadas
El saludo pasa de texto fijo a:

    Hola, {workspace.user?.name ?? 'de nuevo'}.

Si workspace.user?.name no existe (null o undefined), el saludo dice
"Hola, de nuevo." en vez de dejar un espacio vacio o un "Hola, undefined.".
Esto es una decision de fallback razonable, no una premisa nueva de negocio —
si Andres prefiere otro texto de respaldo, se cambia en una linea.

## 6. Interfaces y contratos
Ninguna interfaz nueva. Se usa el campo ya existente workspace.user?.name
(WorkspaceState), sin modificar su tipo.

## 7. Tests que van a romperse a proposito
Ninguno. Cambio de una sola linea de texto en JSX, sin logica nueva.

## 8. Criterio de aceptacion verificable
1. npm run typecheck sin errores.
2. npm test todo verde, sin modificar ningun test existente.
3. grep en components/WorkspaceHome.tsx confirma que la linea del saludo ya
   no contiene el string literal "Imagine" y ahora referencia
   workspace.user?.name.
4. Con una cuenta de prueba que no sea la de Imagine, el saludo muestra el
   nombre de esa cuenta, no "Imagine".

## 9. Que queda deterministico y por que
Todo: es interpolacion directa de un campo existente, sin inferencia.
