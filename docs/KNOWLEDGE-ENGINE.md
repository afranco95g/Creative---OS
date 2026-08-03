# Knowledge Engine de Creative OS

La fuente oficial es exclusivamente `biblioteca_creative_os/`, junto a `.env.local`. React no lee archivos: toda la ingesta y recuperación vive en `services/knowledge/` y está marcada `server-only`.

## Flujo de indexación

`instrumentation.ts` inicializa el motor en runtime Node. El motor recorre subcarpetas, ignora `.knowledge-cache`, calcula SHA-256 y procesa solo archivos nuevos o modificados. PDF conserva página; Markdown, TXT, HTML y DOCX conservan secciones. CSV está activo como texto tabular y XLSX tiene un adaptador pendiente explícito. Los fragmentos apuntan a unas 520 palabras con 70 de solapamiento.

El índice y la auditoría local viven en `biblioteca_creative_os/.knowledge-cache/` y no se versionan. Nunca se cargan PDFs completos durante una conversación.

## Recuperación

`KnowledgeEngine.search()` puntúa primero metadatos y temas, después palabras clave y coincidencia textual. Si se inyecta un `EmbeddingProvider`, agrega similitud coseno sin cambiar la API. `knowledgeOrchestrator.ts` ofrece propósitos separados para conversación, preguntas, interpretación, riesgos, presupuesto, métricas, evaluación y Executive Review.

Cada consulta registra proyecto, propósito, tema, documentos y chunks en `retrieval-log.ndjson`. El endpoint autenticado `/api/knowledge/search` es el límite entre la Mesa cliente y el motor Node. El chat usa los fragmentos de forma efímera y conserva únicamente IDs y títulos de fuente dentro de la respuesta estructurada.

## Agregar documentos

1. Copiar PDF, DOCX, Markdown, TXT, HTML o CSV dentro de `biblioteca_creative_os/`.
2. Añadir o actualizar su fila en `05_catalogo/catalogo_recursos.csv` para mejorar institución, tema, licencia y URL.
3. Reiniciar la aplicación o llamar `/api/knowledge/health`. El checksum evita reprocesar el resto del corpus.
4. Si un archivo cambia, únicamente sus documentos y chunks se reemplazan.

## Persistencia futura

La migración `034_knowledge_engine_metadata.sql` amplía las tablas existentes. El tipo `EmbeddingProvider` permite conectar OpenAI Embeddings y la columna pgvector ya existente sin acoplar el motor a un proveedor. El siguiente paso es implementar un repositorio Supabase que sincronice el mismo `KnowledgeIndex` y ejecute búsqueda vectorial remota.

## Proveedores externos

Todos implementan `KnowledgeProvider`: `search`, `getDocument`, `health` y `supports`. `KnowledgeRetriever` consulta primero `LocalLibraryProvider`, reutiliza `KnowledgeCache` y solo llama a `OpenAlexProvider` cuando la biblioteca es insuficiente, se requiere evidencia reciente o el usuario pide investigación. Para agregar Crossref, UNESCO, World Bank o CKAN se implementa la misma interfaz y se registra el proveedor; ProducerChat no cambia.

OpenAlex usa únicamente `OPENALEX_API_KEY` en Node. La configuración gratuita recomendada es `OPENALEX_DAILY_BUDGET_USD=1`, `OPENALEX_CACHE_HOURS=24`, `OPENALEX_MAX_RESULTS=10` y `OPENALEX_BUDGET_STOP_PERCENT=80`. Al alcanzar el umbral se conservan caché y biblioteca local sin bloquear el chat.
