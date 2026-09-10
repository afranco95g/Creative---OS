# Spec: [nombre]

Todas las secciones son obligatorias. Si una sección no aplica, se escribe
explícitamente "ninguno"/"ninguna" y por qué — una sección vacía o ausente
detiene el ciclo antes de que el constructor escriba una línea de código.

## 1. Objetivo

Una frase. Qué se construye, dicho una sola vez y sin ambigüedad.

## 2. Por qué ahora

Qué problema real resuelve esta pieza de trabajo. No "seria bueno tener X",
sino qué está roto o bloqueado hoy sin esto.

## 3. Archivos que se crean o se modifican

Lista explícita de rutas. Si un archivo se crea, decirlo. Si uno existente se
modifica, decir qué cambia en él. El constructor no debe tocar nada fuera de
esta lista sin detenerse a preguntar.

## 4. Fuera de alcance

Explícito. Esto es lo que evita que el constructor se expanda solo — nombrar
lo que parece relacionado pero NO se hace en esta entrega.

## 5. Decisiones ya tomadas

Todo lo que el constructor NO debe decidir: nombres, estructuras de datos,
casos borde, comportamiento de UX, formato de errores, etc. Si una decisión no
está aquí y no es obvia del código existente, el constructor se detiene y
pregunta — no rellena el hueco con su propio juicio.

## 6. Interfaces y contratos que hay que respetar

Firmas de funciones, tipos, endpoints, props de componentes existentes que esta
entrega debe consumir o exponer sin romper. Si esta entrega introduce una
interfaz nueva pensada para ser intercambiable (p. ej. interpretación de texto
libre), decirlo aquí explícitamente.

## 7. Tests que van a romperse a propósito

Cuáles, por qué se rompen, y en qué se convierten (qué van a verificar después
en su lugar). Si no hay ninguno, se escribe "ninguno" explícitamente — no se
deja la sección vacía ni se omite.

Un test que se rompe sin estar listado aquí es una regresión real, no una
consecuencia esperada — el constructor no debe reescribirlo ni revertir código
para que vuelva a pasar sin que esta sección lo haya anticipado.

## 8. Criterio de aceptación verificable

En términos que el auditor pueda comprobar corriendo algo o leyendo algo
concreto (un comando, un archivo y línea, un caso de prueba). No vale "que
funcione bien" ni "que se vea correcto".

## 9. Qué queda determinista y por qué

Qué partes de esta entrega son deterministas y auditables (plata, puntajes,
consistencia siempre lo son — restricción legal, no solo técnica) y, si hay
interpretación de texto libre, por qué la implementación elegida no compromete
esa frontera.
