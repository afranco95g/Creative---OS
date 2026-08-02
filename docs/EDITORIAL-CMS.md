# CMS editorial

## Activacion

1. Ejecutar `database/023_editorial_cms.sql` en el SQL Editor de Supabase.
2. Configurar `NEXT_PUBLIC_SITE_URL` con la URL canonica de produccion.
3. Asignar `journalist` a quienes redactan y `media_admin` a quienes publican y administran portada.
4. Confirmar que el bucket publico `editorial-media` existe y acepta JPG, PNG y WebP hasta 10 MB.

## Crear otra cuenta periodista

1. Crear el usuario en Supabase Authentication o mediante `/registro`.
2. En `public.profiles`, cambiar `role` a `journalist` y mantener `is_active=true`.
3. Para capacidad de publicar y administrar portada, usar `media_admin`.
4. No compartir ni guardar contraseñas en el repositorio. Para producción se recomiendan cuentas individuales y MFA.

## Prueba minima

- Una cuenta `member` debe recibir acceso denegado en `/admin/stories`.
- Un `journalist` crea, edita, previsualiza y envía un borrador a revisión.
- Un `journalist` no puede publicar, programar ni reorganizar portada.
- Un `media_admin` publica/programa, crea un borrador de portada y lo publica.
- Una publicación publicada aparece en `/medio/[slug]`; un borrador devuelve 404 públicamente.
- Subir una imagen exige JPG/PNG/WebP, máximo 10 MB y texto alternativo.
- Desde `/revision-editorial`, convertir un proyecto propuesto en borrador no expone graph ni messages.
- Probar Web Share, WhatsApp, Facebook, X, LinkedIn y copiar enlace.

## Despliegue

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
git push origin main
```

Aplicar la migración antes de probar el deployment que contiene el CMS.
