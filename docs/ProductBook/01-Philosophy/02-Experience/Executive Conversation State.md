# Executive Conversation State

> Executive Conversation State define el estado mental del Productor Ejecutivo durante una conversación.

No describe el historial.

No resume mensajes.

Describe qué entiende el Productor, qué todavía necesita comprender y cuál sería la intervención con mayor valor en este momento.

---

# 1. Propósito

Una conversación no es una lista de preguntas.

Es un proceso continuo de comprensión.

Creative OS debe mantener un estado interno que represente cómo evoluciona esa comprensión.

Este estado es independiente del modelo de IA utilizado.

---

# 2. El chat no es la conversación

El chat únicamente transporta mensajes.

La conversación ocurre dentro del estado mental del Productor Ejecutivo.

Por esa razón dos conversaciones diferentes podrían producir exactamente el mismo Executive Conversation State.

---

# 3. Qué representa

Executive Conversation State representa:

- qué entiende el Productor;
- qué todavía no entiende;
- qué hipótesis mantiene;
- qué incertidumbres siguen abiertas;
- cuál es la mejor intervención posible;
- cuál fue la última intervención realizada;
- qué contexto debe recuperarse al volver a abrir el proyecto.

---

# 4. Lo que NO representa

No representa:

- historial completo;
- memoria ejecutiva;
- Project Graph;
- documentos;
- tareas.

Todos esos sistemas existen por separado.

Executive Conversation State solamente representa el estado actual del diálogo.

---

# 5. Componentes

## Comprensión actual

¿Qué cree entender el Productor?

Ejemplo

✓ Problema

✓ Propósito

✓ Equipo

✗ Usuario

✗ Validación

✗ Modelo económico

---

## Hipótesis activas

Qué supone actualmente el Productor.

Ejemplo

- Existe una oportunidad clara para un medio cultural.
- El ecosistema puede financiar marcas propias.

---

## Incertidumbres

Lo que todavía necesita comprobar.

Ejemplo

- Público inicial.
- Frecuencia editorial.
- Estrategia comercial.

---

## Curiosidades activas

No son preguntas.

Son temas que merecen explorarse.

Ejemplo

Comprender cómo llegará el primer usuario.

---

## Última intervención

Qué intentó lograr el Productor antes de terminar la sesión.

No necesariamente coincide con el último mensaje enviado.

---

## Próxima mejor intervención

No es la siguiente pregunta.

Es la acción conversacional que probablemente más valor genere.

Puede ser:

- preguntar;
- resumir;
- desafiar una hipótesis;
- conectar ideas;
- proponer una decisión;
- guardar memoria;
- permanecer en silencio.

---

# 6. La conversación nunca sigue un formulario

El usuario puede hablar sobre cualquier tema.

El Productor reorganiza continuamente su comprensión.

Nunca obliga al usuario a responder una pregunta específica.

---

# 7. Intervenciones

Una intervención puede tener distintos objetivos.

## Descubrir

Entender algo nuevo.

## Profundizar

Obtener mayor claridad.

## Confirmar

Validar una hipótesis.

## Contrastar

Comparar dos ideas.

## Resumir

Reducir complejidad.

## Conectar

Relacionar elementos.

## Cuestionar

Desafiar una decisión.

## Celebrar

Reconocer un avance.

## Esperar

No intervenir.

---

# 8. Curiosidad

La curiosidad es dinámica.

No existe una lista fija de preguntas.

Cada nuevo mensaje reorganiza las prioridades del Productor.

---

# 9. Inicio de sesión

Cuando el usuario vuelve al proyecto, Creative OS no debe empezar desde cero.

Debe reconstruir el estado mental.

Ejemplo

"La última vez entendimos la estrategia general del proyecto y validamos los aliados principales.

Todavía me gustaría comprender quién será el primer usuario, aunque podemos continuar por cualquier tema y reorganizaré mi comprensión mientras conversamos."

---

# 10. Final de sesión

Al terminar una conversación debe almacenarse:

- estado de comprensión;
- curiosidades activas;
- intervención pendiente;
- contexto relevante;
- relación con Executive Memory;
- relación con Project Graph.

No es un resumen.

Es una continuidad.

---

# 11. Relación con Executive Memory

Executive Memory recuerda decisiones.

Executive Conversation State recuerda la conversación viva.

Uno conserva historia.

El otro conserva dirección.

---

# 12. Relación con Executive Curiosity Engine

Executive Curiosity Engine decide qué necesita comprender.

Executive Conversation State almacena ese estado entre sesiones.

---

# 13. Relación con Executive Narrative

Executive Narrative explica el proyecto.

Executive Conversation State explica la conversación.

---

# 14. Principios

Creative OS debe:

- conversar antes que preguntar;
- comprender antes que concluir;
- reorganizar antes que insistir;
- intervenir solo cuando aporte valor;
- permitir conversaciones no lineales;
- recuperar el contexto automáticamente;
- respetar el ritmo del usuario.

---

# 15. Definición final

Executive Conversation State es la representación persistente del estado mental del Productor Ejecutivo durante una conversación.

No recuerda únicamente lo que se dijo.

Recuerda qué entiende, qué todavía necesita comprender y cuál es la intervención con mayor potencial para ayudar al proyecto a avanzar.