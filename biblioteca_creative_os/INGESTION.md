# Operación del Knowledge Engine

La biblioteca local es la fuente de ingesta en desarrollo. En producción, el runtime debe consultar `knowledge_sources` y `knowledge_chunks` en Supabase; no debe depender de escanear continuamente este directorio.

## Comandos en Windows

```powershell
npm.cmd run knowledge:scan
npm.cmd run knowledge:ingest
npm.cmd run knowledge:validate
npm.cmd run knowledge:report
```

`knowledge:ingest` actualiza siempre el índice local de forma incremental. Para publicar en Supabase exige `SUPABASE_SERVICE_ROLE_KEY` en el entorno administrativo. Esa clave nunca debe usar el prefijo `NEXT_PUBLIC_` ni almacenarse en el repositorio.

Antes de publicar por primera vez, aplica las migraciones `032`, `034` y `035` en orden.

## Añadir documentos

1. Coloca el original dentro de `biblioteca_creative_os` sin duplicarlo.
2. Añade su metadata al catálogo o manifiesto de su colección.
3. Declara título, institución, año, URL canónica y licencia únicamente cuando estén documentados.
4. Ejecuta escaneo, ingesta y validación.
5. Revisa advertencias de metadata y licencia antes de publicar.

PDF, DOCX, Markdown, texto y HTML se procesan como documentos. CSV y JSON se reservan para catálogos y manifiestos. XLSX no está habilitado hasta que exista un adaptador tabular explícito.

## Actualizar o retirar

- Un archivo modificado cambia de checksum; sus chunks anteriores se reemplazan.
- Un archivo sin cambios se omite.
- Un archivo retirado se marca `missing`/inactivo en el índice; no se elimina su historial automáticamente.
- Para enlazar una fuente con otra colección, añade esa relación al catálogo. El motor conserva una fuente canónica y evita duplicar chunks por checksum, URL o identidad bibliográfica.

## Verificación

`knowledge:validate` comprueba formatos, chunks, jerarquías, modos de razonamiento, checksums, duplicados y las siete consultas canónicas. Los reportes quedan en `biblioteca_creative_os/.knowledge-cache/`, directorio excluido de Git.

Los documentos privados de usuarios, conversaciones y proyectos reales no pertenecen a esta biblioteca. Convertir un proyecto en caso exige consentimiento y un proceso separado de anonimización y revisión humana.
