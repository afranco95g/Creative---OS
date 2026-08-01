# Creative OS Kernel v1

## Objetivo

El Kernel ofrece un lenguaje común para construir actores, proyectos, experiencias y futuras entidades sin duplicar ciclo de vida, capacidades, validación, permisos o eventos.

## Implementación incluida

- Registro tipado de definiciones de entidad.
- Entidades y versiones separadas.
- Capacidades reutilizables.
- Repositorio desacoplado del motor.
- Persistencia local inicial mediante `localStorage`.
- Eventos de dominio básicos.
- Cálculo ponderado de completitud.
- Validación por capacidad y validación global.
- Primer adaptador: `actorEngine`.

## Primer flujo funcional

```ts
const result = actorEngine.createActor({
  actorType: 'space',
  ownerUserId: user.id,
  name: 'Taller La Tata',
});

actorEngine.updateCapability({
  entityId: result.entity.id,
  userId: user.id,
  capabilityId: 'identity',
  data: {
    name: 'Taller La Tata',
    headline: 'Espacio independiente de creación',
  },
  completion: 100,
});

const validation = actorEngine.validateActor(result.entity.id);
```

## Próximo bloque

1. Crear `ActorStore` reactivo.
2. Conectar la creación de actores a `Mi Ecosistema`.
3. Crear el selector Persona / Espacio / Organización / Financiador.
4. Crear el primer formulario de la capacidad Identidad.
5. Sustituir gradualmente el repositorio local por Supabase sin cambiar el contrato del motor.
