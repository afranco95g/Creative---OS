# Guía rápida para integrar la biblioteca

## Estructura sugerida

- `knowledge_sources`
- `knowledge_chunks`
- `knowledge_retrieval_logs`

## Flujo recomendado

1. Registrar cada fuente.
2. Extraer texto conservando página y encabezado.
3. Fragmentar por sección semántica.
4. Etiquetar tema, etapa, tipo de proyecto y jurisdicción.
5. Generar embeddings.
6. Recuperar entre 3 y 6 fragmentos por consulta.
7. Guardar qué fragmentos influyeron en una recomendación.

## Regla conversacional

La biblioteca debe ayudar a formular la siguiente pregunta, no reemplazar el diálogo con una clase extensa.

Ejemplo:

Usuario: "Hacer el zapato cuesta 80.000 y lo vendo en 220.000".

Respuesta esperada del sistema:

- registrar costo y precio como datos explícitos;
- calcular margen bruto preliminar;
- aclarar que no equivale a utilidad neta;
- preguntar qué componentes incluye el costo;
- proponer, con confirmación, líneas de costo e ingreso.
