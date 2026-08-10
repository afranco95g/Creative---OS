# Executive Engine V2.3: Confirmation and Consistency

## Confirmation lifecycle

```text
pending
├─ accepted  -> entidades confirmadas + confirmedAt
├─ rejected  -> entidades contradicted; historial conservado
├─ edited    -> versión anterior superseded + nueva evidencia
└─ dismissed -> interpretación provisional y recuperable
```

Las acciones son llamadas de dominio, no mensajes de conversación. Las fechas,
responsabilidades y cifras financieras soportadas requieren confirmación. Los
helpers públicos permiten consultar conocimiento activo, propuesto o confirmado,
confirmaciones pendientes y diferidas, reabrir una solicitud y aplicar una
corrección.

Una corrección explícita conserva ambas versiones y enlaza la nueva con `corrects`.
Al confirmar una nueva propuesta se superseden propuestas anteriores de la misma
clave. Dos valores ya confirmados no se sustituyen silenciosamente: pasan a
evaluación de contradicción.

## Consistency lifecycle

```text
Project Knowledge confirmado + estructuras operativas
  -> evaluateProjectConsistency
  -> open issue
  -> acknowledged | resolved | dismissed
```

Los issues contienen fingerprint, severidad, explicación no autoritaria,
entidades y módulos relacionados, valores esperado/actual, diferencia, confianza
y acción sugerida. Una reevaluación conserva identidad e historial. Si desaparece
la condición, un issue abierto se resuelve sin eliminarse.

## Reglas implementadas

1. **Cantidad × costo unitario frente a total declarado.** Solo usa una entidad
   financiera confirmada que contenga los tres valores.
2. **Equipo frente a presupuesto.** Compara cantidad y compensación confirmadas
   con líneas de personal del mismo periodo. Si el periodo no es comparable no
   genera issue.
3. **Aforo frente a capacidad.** Un aforo confirmado mayor que la capacidad
   confirmada genera severidad crítica.
4. **Actividad potencialmente no presupuestada.** Parte de una actividad
   estructurada y busca una línea compatible; no inventa un costo y contempla
   aportes propios o en especie.
5. **Actividad importante sin responsable.** Solo aplica a entidades de actividad
   confirmadas y suficientemente estructuradas.
6. **Fecha frente a cronograma.** Detecta producción que termina después de una
   fecha confirmada de lanzamiento/evento.
7. **Contradicción de conocimiento.** Dos valores activos y confirmados para la
   misma clave generan un issue crítico. Las versiones superseded se excluyen.

## Prioridad y chat

La prioridad inicial ordena `critical`, `warning`, `info` y después confianza. El
chat muestra como máximo un issue abierto con confianza mínima 0.8. Los warnings
no bloquean y siempre permiten continuar. Reconocer o descartar una advertencia
queda registrado.

## Deduplicación

El fingerprint combina tipo, entidades y valores comparados. Reevaluar la misma
condición no crea otro issue. La resolución tampoco borra el issue.

## Persistencia y privacidad

Confirmaciones e issues forman parte de `ProjectGraph`, por lo que usan localStorage,
Supabase y snapshots existentes. No se envían a OpenAlex, no se indexan en la
biblioteca global y no forman parte automáticamente del snapshot público de una
aplicación.

## Falsos positivos esperables

- conceptos presupuestales con nombres demasiado genéricos;
- periodos expresados en unidades no normalizadas;
- actividades costosas cubiertas por una línea agregada con otro nombre;
- cronogramas de ediciones diferentes sin contexto explícito;
- claves semánticas iguales usadas para contextos distintos.

Las explicaciones se redactan como asuntos a revisar, no como errores declarados.

## Limitaciones

- No hay Dependency Engine ni camino crítico.
- No hay cálculo financiero de escenarios.
- La edición de confirmaciones cubre especialmente alcance de costo; otros dominios
  dependen de la interpretación general.
- No existe todavía un panel histórico; los selectores y estados persistentes
  preparan esa capacidad.
- La asociación actividad-presupuesto usa campos estructurados y un fallback
  lexical secundario cuando aún no existe una taxonomía común de costos.

## Próximos pasos

V2.4 debería introducir contexto/edición explícitos para claves semánticas,
normalización de periodos, asociación estable actividad-presupuesto-responsable y
una bandeja ligera para confirmaciones diferidas e issues reconocidos.
