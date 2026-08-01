import type { EntityDefinition } from '../../core/entities/entity.types';

const sharedCapabilities = {
  identity: {
    id: 'identity',
    label: 'Identidad',
    description: 'Nombre, titular, descripción e información básica.',
    required: true,
    weight: 3,
    minimumCompletion: 100,
  },
  story: {
    id: 'story',
    label: 'Historia',
    description: 'Biografía, trayectoria, propósito, misión y visión.',
    required: true,
    weight: 2,
    minimumCompletion: 70,
  },
  media: {
    id: 'media',
    label: 'Galería',
    description: 'Imágenes, videos, documentos y material de presentación.',
    weight: 1,
  },
  social: {
    id: 'social',
    label: 'Canales',
    description: 'Sitio web, redes sociales y canales de contacto.',
    weight: 1,
  },
  location: {
    id: 'location',
    label: 'Ubicación',
    description: 'Ciudad, territorio, dirección o área de operación.',
    weight: 1,
  },
  services: {
    id: 'services',
    label: 'Servicios',
    description: 'Oferta, productos, actividades o formas de colaboración.',
    weight: 2,
  },
  team: {
    id: 'team',
    label: 'Equipo',
    description: 'Personas, roles y estructura del equipo.',
    weight: 1,
  },
} as const;

export const actorDefinitions: EntityDefinition[] = [
  {
    type: 'person',
    label: 'Persona',
    description: 'Artista, productor, periodista, gestor o profesional creativo.',
    minimumCompletion: 70,
    capabilities: [
      sharedCapabilities.identity,
      sharedCapabilities.story,
      sharedCapabilities.media,
      sharedCapabilities.services,
      sharedCapabilities.social,
      sharedCapabilities.location,
    ],
  },
  {
    type: 'space',
    label: 'Espacio',
    description: 'Lugar cultural, taller, galería, estudio o escenario.',
    minimumCompletion: 70,
    capabilities: [
      sharedCapabilities.identity,
      sharedCapabilities.story,
      sharedCapabilities.media,
      sharedCapabilities.services,
      sharedCapabilities.location,
      sharedCapabilities.team,
      sharedCapabilities.social,
    ],
  },
  {
    type: 'organization',
    label: 'Organización',
    description: 'Colectivo, empresa, fundación, medio o institución.',
    minimumCompletion: 70,
    capabilities: [
      sharedCapabilities.identity,
      sharedCapabilities.story,
      sharedCapabilities.media,
      sharedCapabilities.services,
      sharedCapabilities.team,
      sharedCapabilities.location,
      sharedCapabilities.social,
    ],
  },
  {
    type: 'funder',
    label: 'Financiador',
    description: 'Marca, institución, fondo o aliado que moviliza recursos.',
    minimumCompletion: 70,
    capabilities: [
      sharedCapabilities.identity,
      sharedCapabilities.story,
      sharedCapabilities.services,
      sharedCapabilities.team,
      sharedCapabilities.social,
    ],
  },
];
