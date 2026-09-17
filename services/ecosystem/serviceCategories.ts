// Vocabulario cerrado de categorías de servicio del ecosistema — la misma
// lista de 12 valores que ya vive como check constraint en
// funders.service_categories y spaces.service_categories
// (database/044_actor_service_categories.sql). Fuente única de verdad en
// TypeScript: la usan tanto las "Necesidades" de un proyecto
// (ProjectTools.needs, Fase 2 del motor de emparejamiento) como, más
// adelante, cualquier formulario de aliados que escriba en esa columna.
//
// Ver: EL CULEBREO - Aliados y modelo de necesidades-servicios (borrador).md,
// sección 3, para la tabla completa de quién ofrece cada categoría hoy.
export const SERVICE_CATEGORIES = [
  ['audiovisual_production_space', 'Espacio para grabación/producción audiovisual'],
  ['events_space', 'Espacio para eventos y activaciones'],
  ['coworking_space', 'Espacio de coworking'],
  ['music_production', 'Producción y grabación musical'],
  ['equipment_rental', 'Renta de equipos — fotografía, audiovisual'],
  ['graphic_design', 'Diseño gráfico y de marca'],
  ['merch_printing', 'Estampado y confección de merch'],
  ['printing_services', 'Impresión — textil, papel, adhesivo, empaques, editorial'],
  ['workshops_mentorship', 'Talleres, clases y acompañamiento creativo'],
  ['tattoo', 'Tatuajes'],
  ['funding', 'Financiación / convocatorias'],
  ['marketing_activations', 'Marketing, activaciones BTL y lanzamientos'],
] as const;
