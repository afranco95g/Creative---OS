export type Section = 'chat' | 'proyecto' | 'bitacora' | 'documentos' | 'ipp';

export const project = {
  name: 'Charlie Gelato',
  tagline: 'Heladería artesanal + espacio cultural',
  progress: 62,
  objective: 'Crear una heladería artesanal que conecte a personas a través del helado, la cultura, el diseño y experiencias significativas en Bogotá.',
  context: 'Bogotá, con foco inicial en Chapinero y localidades con circuitos culturales activos. El proyecto nace como una marca de producto que puede activar espacios creativos antes de abrir un punto físico.',
  community: 'Personas entre 18 y 35 años interesadas en cultura, arte, diseño, gastronomía, experiencias locales y consumo consciente.',
  specificObjectives: [
    'Validar el producto mediante activaciones culturales y degustaciones guiadas.',
    'Diseñar una programación de talleres y experiencias donde el producto haga parte del ticket.',
    'Construir una base de comunidad propia a partir de asistentes, aliados y espacios.',
    'Crear un modelo replicable de integración con espacios creativos.'
  ],
  activities: ['Taller de serigrafía + gelato', 'Degustación editorial', 'Pop-up cultural', 'Alianza con Taller Ujalata', 'Registro audiovisual'],
  risks: ['Presupuesto incompleto', 'Alianzas por formalizar', 'Cronograma operativo por detallar'],
  budget: '$45.000.000 COP estimados'
};

export const logEntries = [
  { title: 'Definimos el propósito del proyecto', time: 'Hoy, 11:23 AM', body: 'Charlie Gelato se plantea como una marca de helado artesanal que conecta producto, cultura y comunidad.', tags: ['propósito', 'visión'] },
  { title: 'Identificamos comunidad objetivo', time: 'Hoy, 11:45 AM', body: 'Personas de 18 a 35 años interesadas en cultura, diseño, arte y experiencias locales.', tags: ['comunidad', 'público'] },
  { title: 'Detectamos oportunidades clave', time: 'Hoy, 12:10 PM', body: 'El producto puede financiar experiencias si se integra dentro del ticket de talleres y activaciones.', tags: ['oportunidad', 'modelo'] },
  { title: 'Primeros objetivos específicos', time: 'Hoy, 12:35 PM', body: 'Se establecieron cuatro objetivos que guiarán el desarrollo inicial del proyecto.', tags: ['objetivos'] }
];

export const docs = [
  { name: 'One Pager', description: 'Resumen ejecutivo del proyecto', ready: true },
  { name: 'Propuesta', description: 'Documento para marcas o aliados', ready: true },
  { name: 'Presupuesto', description: 'Estructura inicial de costos', ready: false },
  { name: 'Cronograma', description: 'Plan de actividades y tiempos', ready: false },
  { name: 'Convocatoria', description: 'Adaptación para fondos y estímulos', ready: false },
  { name: 'Pitch', description: 'Narrativa de presentación', ready: true }
];

export const ipp = {
  score: 72,
  strengths: ['Propósito claro', 'Comunidad definida', 'Contexto bien identificado', 'Propuesta de valor sólida'],
  improve: ['Presupuesto detallado', 'Alianzas estratégicas', 'Cronograma operativo'],
  recommendation: 'El proyecto tiene alto potencial para activaciones de marca y alianzas con espacios creativos. La siguiente etapa es precisar costos, responsables y calendario.'
};
