# Build notes

- `npm run typecheck` fue ejecutado correctamente después de integrar Kernel v1.
- El `next build` no se completó en el entorno de entrega porque la reinstalación de dependencias excedió el tiempo disponible del contenedor.
- En el equipo local, ejecutar:

```bash
npm install
npm run typecheck
npm run build
```
