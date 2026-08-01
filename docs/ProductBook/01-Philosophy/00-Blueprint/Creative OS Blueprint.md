# Creative OS Blueprint

> Versión 1.0
>
> Este documento define la arquitectura funcional de Creative OS.
>
> Ninguna pantalla, motor o funcionalidad debe desarrollarse sin tener primero un lugar claro dentro de este Blueprint.

---

# 1. ¿Qué es Creative OS?

Creative OS es el sistema operativo de un Productor Creativo.

No es únicamente un gestor de proyectos.

No es únicamente un chat.

No es un ERP tradicional.

Es un entorno operativo donde una persona puede transformar:

```text
Ideas
↓
Proyectos
↓
Producción
↓
Organizaciones
↓
Ecosistemas
```

Todo el software está diseñado alrededor del trabajo diario de un Productor Ejecutivo.

Creative OS ayuda a comprender, organizar, producir, conectar y activar proyectos.

---

# 2. Pregunta central

Creative OS siempre debe responder una pregunta:

> ¿Qué necesita este proyecto para avanzar hoy?

Cada pantalla, motor y herramienta existe para ayudar al usuario a responder esa pregunta con mayor claridad.

---

# 3. Filosofía del producto

Creative OS no debe obligar al usuario a pensar como el software.

El software debe aprender a pensar con el usuario.

La persona conversa de manera natural.

Creative OS interpreta esa conversación y la convierte en:

- estructura;
- tareas;
- documentos;
- cronogramas;
- decisiones;
- riesgos;
- oportunidades;
- conexiones;
- siguientes pasos.

---

# 4. Principios

Todo Creative OS debe cumplir estas reglas.

## 4.1 Conversar antes que preguntar

El usuario no debe sentir que está llenando un formulario.

El Productor Ejecutivo escucha primero y pregunta únicamente cuando una respuesta puede desbloquear valor.

## 4.2 Organizar antes que mostrar

Creative OS no debe mostrar información desordenada.

Primero interpreta.

Después estructura.

Finalmente presenta.

## 4.3 Convertir información en decisiones

La información solo es útil cuando ayuda a decidir qué hacer.

## 4.4 Mostrar progreso visible

Cada conversación debe producir movimiento en la interfaz.

El usuario debe poder ver qué cambió.

## 4.5 Reducir ansiedad

La aplicación debe ayudar a priorizar.

Nunca debe presentar demasiadas decisiones al mismo tiempo.

## 4.6 Mantener contexto

Creative OS debe recordar lo que el usuario ya explicó.

No debe repetir preguntas innecesariamente.

## 4.7 Acompañar sin reemplazar

El Productor Ejecutivo no sustituye el criterio humano.

Ayuda a pensar, organizar y actuar mejor.

## 4.8 Traducir complejidad

Internamente el sistema puede usar módulos, métricas y motores.

Externamente debe hablar en un lenguaje humano y claro.

---

# 5. Arquitectura general de experiencia

Creative OS está compuesto por cuatro grandes niveles.

```text
Landing
↓
Executive Workspace
↓
Proyecto
↓
Mesa de Producción
```

El Productor Ejecutivo acompaña transversalmente todos los niveles.

---

# 6. Nivel 0 — Landing

La Landing es la entrada pública a Creative OS.

Pregunta que responde:

> ¿Qué es Creative OS y por qué debería entrar?

La Landing debe comunicar:

- la propuesta de valor;
- qué puede hacer el software;
- cómo funciona;
- para quién existe;
- cómo se relaciona con el ecosistema creativo;
- quiénes son sus aliados;
- cómo comenzar.

La Landing debe permitir:

- crear un estudio;
- entrar a un estudio existente;
- conocer el ecosistema;
- comprender el modelo;
- explorar aliados y recursos.

---

# 7. Nivel 1 — Executive Workspace

El Executive Workspace es la pantalla principal de trabajo.

Representa el escritorio diario del Productor Ejecutivo.

Pregunta que responde:

> ¿Qué debería hacer hoy?

Aquí el usuario encuentra:

- proyectos activos;
- tareas pendientes;
- prioridades;
- decisiones importantes;
- recordatorios;
- cronograma general;
- acceso a crear un proyecto;
- acceso a la Biblioteca;
- acceso futuro a la Red.

El Workspace no debe ser una lista pasiva.

Debe funcionar como un briefing ejecutivo.

---

# 8. Nivel 2 — Proyecto

Cada proyecto tiene su propio espacio operativo.

Pregunta que responde:

> ¿Cómo está este proyecto?

El proyecto debe mostrar:

- estado general;
- progreso;
- áreas fuertes;
- áreas débiles;
- próximas prioridades;
- tareas;
- cronograma;
- documentos;
- riesgos;
- oportunidades;
- actores vinculados.

El usuario no debe ver directamente la estructura técnica del ProjectGraph.

Debe ver una traducción ejecutiva.

---

# 9. Áreas universales del proyecto

Creative OS organiza internamente la información en módulos.

Sin embargo, el usuario ve áreas de trabajo.

## 9.1 Dirección

Pregunta:

> ¿Hacia dónde va el proyecto?

Incluye:

- identidad;
- propósito;
- problema;
- contexto;
- comunidad;
- objetivo general;
- objetivos específicos.

## 9.2 Producción

Pregunta:

> ¿Cómo sucede?

Incluye:

- actividades;
- cronograma;
- tareas;
- riesgos;
- entregables;
- operación.

## 9.3 Recursos

Pregunta:

> ¿Qué necesita para existir?

Incluye:

- presupuesto;
- costos;
- ingresos;
- sostenibilidad;
- financiación;
- recursos disponibles.

## 9.4 Personas

Pregunta:

> ¿Quién lo hace posible?

Incluye:

- equipo;
- roles;
- responsables;
- aliados;
- comunidad;
- colaboradores.

## 9.5 Comunicación

Pregunta:

> ¿Cómo se cuenta?

Incluye:

- narrativa;
- pitch;
- presentación;
- documentos;
- contenidos;
- difusión.

## 9.6 Ecosistema

Pregunta:

> ¿Con quién se conecta?

Incluye:

- aliados;
- oportunidades;
- espacios;
- proveedores;
- patrocinadores;
- convocatorias;
- red.

## 9.7 Impacto

Pregunta:

> ¿Qué cambia y cómo evoluciona?

Incluye:

- resultados;
- indicadores;
- aprendizaje;
- sostenibilidad;
- evidencia;
- evolución.

---

# 10. Nivel 3 — Mesa de Producción

La Mesa de Producción es el centro operativo de cada proyecto.

Pregunta que responde:

> ¿Qué necesito producir ahora?

La Mesa de Producción reúne:

- Dashboard Ejecutivo;
- Cronograma;
- Tareas;
- Documentos;
- Diagnóstico;
- Bitácora;
- Productor Ejecutivo;
- Feed de Producción.

Todo gira alrededor del proyecto activo.

Cambiar de proyecto cambia completamente la Mesa de Producción.

---

# 11. Productor Ejecutivo

El Productor Ejecutivo es la inteligencia principal de Creative OS.

No es solamente un chatbot.

No es solamente un asistente.

Es un acompañante de producción.

Su misión es:

> Ayudar al usuario a construir mejores proyectos.

El Productor Ejecutivo debe:

- escuchar;
- interpretar;
- estructurar;
- priorizar;
- cuestionar;
- proponer;
- detectar riesgos;
- crear tareas;
- generar documentos;
- identificar oportunidades;
- conectar actores;
- acompañar decisiones.

---

# 12. Regla del avance visible

Cada mensaje del usuario debe producir al menos una de estas cosas:

- una mejor comprensión;
- una actualización del proyecto;
- una tarea;
- una decisión;
- un riesgo;
- una recomendación;
- un documento;
- una oportunidad;
- una nueva conexión.

La conversación no debe avanzar únicamente en palabras.

Debe producir cambios visibles.

---

# 13. Pipeline de producción

Cada mensaje del usuario activa una cadena de producción.

```text
Mensaje del usuario
↓
Conversation Engine
↓
ProjectGraph
↓
Production Pipeline
↓
Executive Brain
↓
Production Engine
↓
Experience Engine
↓
Document Engine
↓
Action Engine
↓
Interfaz actualizada
```

El usuario no necesita ver los nombres técnicos.

Debe sentir que el sistema está trabajando.

---

# 14. Experience Layer

La Experience Layer decide qué debe ver el usuario mientras Creative OS trabaja.

Debe mostrar:

## Pensamiento

Ejemplo:

> Estoy organizando la dirección del proyecto.

## Producción

Ejemplo:

> Actualizando el One Pager.

## Resultado

Ejemplo:

> Se fortaleció la definición de comunidad.

La interfaz debe hacer visible el trabajo invisible de producción.

---

# 15. Feed de Producción

El Feed de Producción registra cambios importantes.

Ejemplos:

```text
Se fortaleció la Dirección.

El One Pager avanzó al 48%.

Se creó la tarea “Definir presupuesto inicial”.

Se detectó un riesgo financiero.

Se identificó una posible alianza.
```

No debe mostrar logs técnicos.

Debe mostrar producción comprensible.

---

# 16. Documentos vivos

Los documentos no deben construirse desde cero cada vez.

Se alimentan automáticamente del ProjectGraph.

Ejemplos:

- One Pager;
- propuesta;
- pitch;
- cronograma;
- presupuesto;
- brief;
- diagnóstico;
- informe;
- presentación;
- documento para aliados.

Cada documento debe mostrar:

- porcentaje de preparación;
- información disponible;
- información faltante;
- posibilidad de revisión;
- última actualización.

---

# 17. Cronograma

El Cronograma organiza el tiempo del proyecto.

Debe permitir visualizar:

- fases;
- hitos;
- actividades;
- tareas;
- responsables;
- fechas;
- bloqueos;
- dependencias.

Puede presentarse como:

- calendario;
- timeline;
- lista semanal;
- vista mensual;
- agenda diaria.

Al seleccionar una actividad, el usuario debe poder ver:

- qué debe hacerse;
- qué información existe;
- qué falta;
- quién es responsable;
- qué subtareas contiene;
- qué recursos necesita;
- qué documentos están relacionados.

---

# 18. Tareas

Las tareas deben nacer de:

- conversaciones;
- decisiones;
- documentos;
- riesgos;
- cronogramas;
- recomendaciones;
- actividades.

Cada tarea debe poder contener:

- título;
- descripción;
- proyecto;
- área;
- responsable;
- fecha;
- prioridad;
- estado;
- subtareas;
- bloqueos;
- evidencia;
- comentarios.

Las tareas no deben existir aisladas.

Siempre deben relacionarse con una necesidad real del proyecto.

---

# 19. Diagnóstico

El Diagnóstico interpreta el estado actual del proyecto.

Pregunta que responde:

> ¿Qué tan preparado está este proyecto y qué necesita fortalecer?

Debe mostrar:

- preparación general;
- áreas sólidas;
- áreas en construcción;
- áreas críticas;
- riesgos;
- bloqueos;
- siguiente prioridad;
- documentos disponibles;
- nivel de preparación para revisión humana;
- nivel de preparación para activación.

El diagnóstico no evalúa la calidad artística de una idea.

Evalúa su capacidad para ejecutarse.

---

# 20. Bitácora viva

La Bitácora registra la evolución del proyecto.

Debe conservar:

- conversaciones;
- decisiones;
- cambios;
- aprendizajes;
- riesgos;
- tareas creadas;
- documentos generados;
- aliados vinculados;
- activaciones;
- resultados.

La Bitácora debe permitir reconstruir cómo evolucionó el proyecto.

---

# 21. Biblioteca

La Biblioteca es una herramienta transversal.

Pregunta que responde:

> ¿Qué puedo aprender, consultar o reutilizar?

Puede contener:

- libros;
- artículos;
- metodologías;
- convocatorias;
- plantillas;
- documentos;
- referencias;
- casos de estudio;
- recursos gratuitos;
- conocimiento producido por el ecosistema.

Los recursos deben poder relacionarse con:

- áreas del proyecto;
- tipos de usuario;
- sectores;
- problemas;
- tareas;
- etapas de producción.

---

# 22. Red

La Red conecta personas, organizaciones y capacidades.

Pregunta que responde:

> ¿Quién puede ayudarme?

La Red puede incluir:

- productores;
- artistas;
- gestores;
- espacios;
- talleres;
- proveedores;
- marcas;
- financiadores;
- medios;
- mentores;
- instituciones.

Cada perfil debe permitir registrar:

- experiencia;
- capacidades;
- intereses;
- ubicación;
- disponibilidad;
- proyectos anteriores;
- sectores;
- necesidades;
- tipos de colaboración.

---

# 23. Matching inteligente

El Matching ayuda a conectar proyectos con actores relevantes.

Debe considerar:

- necesidades del proyecto;
- capacidades del actor;
- experiencia;
- territorio;
- disponibilidad;
- intereses;
- valores;
- etapa del proyecto;
- presupuesto;
- riesgos;
- afinidad.

El Matching no debe tomar decisiones finales automáticamente.

Debe proponer conexiones y explicar por qué podrían funcionar.

---

# 24. Organizaciones y equipos

Un usuario puede pertenecer a una o varias organizaciones.

Una organización puede tener:

- miembros;
- roles;
- proyectos;
- documentos;
- calendario;
- aliados;
- recursos;
- permisos.

Los proyectos pueden ser:

- personales;
- compartidos;
- organizacionales;
- públicos;
- privados.

Los permisos deben permitir definir:

- quién puede ver;
- quién puede editar;
- quién puede aprobar;
- quién puede comentar;
- quién puede administrar.

---

# 25. Perfiles y roles

Una persona puede tener varios roles.

Ejemplos:

- Productor Ejecutivo;
- Project Manager;
- Artista;
- Gestor Cultural;
- Diseñador;
- Espacio Creativo;
- Marca;
- Financiador;
- Proveedor;
- Medio;
- Mentor;
- Investigador.

Creative OS debe evitar encasillar a las personas en una sola categoría.

Los roles ayudan a comprender capacidades y posibles relaciones.

---

# 26. Configuración

La Configuración debe permitir gestionar:

- perfil;
- estudio;
- organizaciones;
- preferencias;
- notificaciones;
- privacidad;
- permisos;
- almacenamiento;
- integraciones;
- apariencia;
- datos;
- seguridad.

En modo de desarrollo también podrá incluir:

- reiniciar Workspace;
- cargar proyecto de ejemplo;
- simular usuario nuevo;
- generar datos de prueba.

---

# 27. Arquitectura funcional

Creative OS se organiza en capas.

```text
Interfaz
↓
Controllers
↓
Stores
↓
Engines
↓
Repositories
↓
Persistencia
```

## Interfaz

Muestra el estado y recibe acciones del usuario.

## Controllers

Coordinan acciones completas.

Ejemplos:

- crear proyecto;
- abrir proyecto;
- cerrar proyecto;
- sincronizar;
- generar documento;
- activar oportunidad.

## Stores

Administran el estado de la aplicación.

## Engines

Analizan, producen y recomiendan.

## Repositories

Guardan y recuperan información.

## Persistencia

Actualmente:

- localStorage.

Futuro:

- Supabase;
- PostgreSQL;
- almacenamiento de archivos;
- autenticación;
- sincronización en tiempo real.

---

# 28. Arquitectura de inteligencia

Los motores principales son:

- Conversation Engine;
- Executive Brain;
- Memory Engine;
- Question Engine;
- Action Engine;
- Document Engine;
- Production Engine;
- Experience Engine;
- Universal Project Mapper;
- Executive Narrative Engine;
- Production Pipeline.

Cada motor debe tener una responsabilidad clara.

Ningún motor debe intentar hacer todo.

---

# 29. Arquitectura de datos

La estructura principal debe permitir representar:

```text
Usuario
↓
Workspace
↓
Organización
↓
Proyecto
↓
ProjectGraph
↓
Conversaciones
↓
Tareas
↓
Cronograma
↓
Documentos
↓
Relaciones
↓
Activaciones
↓
Resultados
```

El sistema debe poder guardar múltiples proyectos por usuario.

Cada proyecto debe conservar su propio:

- grafo;
- conversación;
- progreso;
- tareas;
- documentos;
- eventos;
- decisiones;
- riesgos;
- relaciones.

---

# 30. Roadmap de experiencia

Creative OS evoluciona acompañando al usuario durante diferentes momentos.

---

# Acto I — Entrar al Estudio

## Objetivo

Que el usuario sienta que acaba de entrar a un estudio preparado para ayudarle.

## Experiencias

- Landing;
- bienvenida;
- onboarding;
- creación del Workspace;
- primer proyecto.

---

# Acto II — Organizar el Trabajo

## Objetivo

Ayudar al usuario a decidir en qué trabajar hoy.

## Experiencias

- Executive Workspace;
- prioridades;
- calendario maestro;
- tareas;
- proyectos activos;
- nuevo proyecto;
- Biblioteca.

---

# Acto III — Construir

## Objetivo

Convertir una idea en un proyecto sólido.

## Experiencias

- Mesa de Producción;
- Dashboard Ejecutivo;
- Productor Ejecutivo;
- cronograma;
- tareas;
- documentos;
- diagnóstico;
- bitácora.

---

# Acto IV — Activar

## Objetivo

Conectar proyectos con capacidades y oportunidades reales.

## Experiencias

- aliados;
- espacios;
- talento;
- proveedores;
- marcas;
- financiadores;
- convocatorias;
- activaciones;
- revisión humana.

---

# Acto V — Escalar

## Objetivo

Convertir Creative OS en la infraestructura de un ecosistema creativo.

## Experiencias

- Red;
- equipos;
- organizaciones;
- matching inteligente;
- marketplace de talento;
- marketplace de proyectos;
- inteligencia territorial;
- aprendizaje colectivo.

---

# 31. Etapas de producto

## Versión 0.1 — Prototipo funcional

Incluye:

- Productor Ejecutivo;
- ProjectGraph;
- Dashboard;
- documentos;
- Workspace;
- múltiples proyectos;
- persistencia local.

## Versión 0.5 — Beta privada

Incluye:

- autenticación;
- base de datos;
- perfiles;
- tareas;
- cronograma;
- documentos persistentes;
- invitación de usuarios.

## Versión 1.0 — Creative OS

Incluye:

- Workspace completo;
- proyectos;
- Productor Ejecutivo;
- tareas;
- calendario;
- Biblioteca;
- documentos;
- diagnóstico;
- colaboración básica.

## Versión 2.0 — Ecosistema

Incluye:

- Red;
- perfiles;
- organizaciones;
- oportunidades;
- matching;
- activaciones;
- relaciones.

## Versión 3.0 — Plataforma

Incluye:

- marketplace;
- inteligencia cultural;
- datos territoriales;
- financiación;
- integraciones;
- APIs;
- modelos avanzados de IA.

---

# 32. Criterios de calidad

Una funcionalidad solo debe aprobarse si cumple estas preguntas:

1. ¿Ayuda al usuario a avanzar?

2. ¿Reduce confusión?

3. ¿Produce algo visible?

4. ¿Respeta el contexto del proyecto?

5. ¿Puede explicarse con lenguaje humano?

6. ¿Tiene un lugar claro en el Blueprint?

7. ¿Puede crecer sin romper la arquitectura?

8. ¿Se siente como trabajar con un productor?

---

# 33. Momento wow

La primera experiencia debe producir valor en menos de cinco minutos.

El flujo ideal es:

```text
Usuario entra
↓
Describe una idea
↓
Creative OS la interpreta
↓
Organiza áreas
↓
Genera primeras tareas
↓
Actualiza documentos
↓
Muestra un diagnóstico
↓
Propone el siguiente paso
```

El usuario debe pensar:

> Esto entiende cómo trabajo.

---

# 34. Definición de éxito

Creative OS no es exitoso porque tenga muchas funciones.

Es exitoso cuando:

- una idea se vuelve más clara;
- un proyecto avanza;
- una persona toma una mejor decisión;
- una tarea encuentra responsable;
- un documento puede presentarse;
- una conexión se vuelve posible;
- una oportunidad se activa;
- un proyecto llega a la realidad.

---

# 35. Regla final

Creative OS no debe convertirse en un sistema lleno de funciones.

Debe seguir siendo una herramienta capaz de responder:

> ¿Qué necesita este proyecto para avanzar hoy?

Todo lo que no ayude a responder esa pregunta debe cuestionarse.

---

# FIN

Este Blueprint define la arquitectura funcional de Creative OS versión 1.0.

Los futuros cambios deben:

1. actualizar primero este documento;
2. definir la experiencia;
3. diseñar la arquitectura;
4. implementar;
5. probar;
6. documentar el aprendizaje.

Ningún nuevo documento fundacional debe abrirse dejando este Blueprint incompleto.