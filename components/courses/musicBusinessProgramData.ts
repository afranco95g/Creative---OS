export interface LessonResource {
  id: string;
  title: string;
  type: 'template' | 'budget' | 'contract' | 'deck' | 'workflow' | 'document';
  format: 'PDF' | 'XLSX' | 'DOCX' | 'FIGMA' | 'NOTION';
  size: string;
  description: string;
  downloadUrl: string;
}

export interface ProgramLesson {
  id: string;
  position: number;
  title: string;
  durationMinutes: number;
  description: string;
  keyTakeaways: string[];
}

export interface ProgramModule {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  estimatedHours: number;
  description: string;
  learningObjectives: string[];
  lessons: ProgramLesson[];
  resources: LessonResource[];
}

export const MUSIC_BUSINESS_PROGRAM: ProgramModule[] = [
  {
    id: 'm1-industria-musical',
    number: 1,
    title: 'Módulo 1: Industria Musical para Principiantes',
    shortTitle: 'M1: Industria Musical',
    estimatedHours: 12,
    description:
      'Comprende el panorama general de los ecosistemas sonoros contemporáneos, los agentes clave de la cadena de valor y las bases identitarias y creativas necesarias para estructurar un proyecto artístico sostenible.',
    learningObjectives: [
      'Mapear las dinámicas locales, nacionales e internacionales de la industria musical actual.',
      'Construir y afilar la propuesta de valor, identidad sonora y estética visual del artista.',
      'Definir los fundamentos narrativos de marca para conectar con audiencias y monetizar catálogos digitales.',
    ],
    lessons: [
      {
        id: 'm1-l1',
        position: 1,
        title: 'Exploración del medio musical local, nacional e internacional',
        durationMinutes: 45,
        description:
          'Ecosistema global de la música, circuitos independientes, majors, agregadores y el rol de las plataformas de streaming en América Latina.',
        keyTakeaways: [
          'Agentes de la cadena de valor musical.',
          'Diferenciación entre mercado local y global.',
          'Modelos de monetización digital directa.',
        ],
      },
      {
        id: 'm1-l2',
        position: 2,
        title: 'Definición de identidad sonora y visual',
        durationMinutes: 50,
        description:
          'Traducción de la visión musical a un universo gráfico coherente: paleta de color, tipografía, fotografía y dirección de arte.',
        keyTakeaways: [
          'Brandboard musical.',
          'Consistencia estética en portadas y visualizers.',
          'Manual básico de identidad artística.',
        ],
      },
      {
        id: 'm1-l3',
        position: 3,
        title: 'Proceso creativo: composición, arreglos y producción',
        durationMinutes: 60,
        description:
          'Etapas de producción desde la maqueta preliminar hasta el master final, split sheets de autoría y créditos técnicos.',
        keyTakeaways: [
          'Gestión de sesiones de estudio.',
          'Split sheet de co-autoría y derechos conexos.',
          'Control de entregables (Stems, Mix, Master).',
        ],
      },
      {
        id: 'm1-l4',
        position: 4,
        title: 'Construcción de marca y narrativa artística',
        durationMinutes: 40,
        description:
          'Storytelling y arquitectura de marca para proyectos sonoros. Cómo comunicar el discurso del proyecto ante medios, sellos y fans.',
        keyTakeaways: [
          'Arquetipo de marca y tono de comunicación.',
          'Biografía ejecutiva y manifiesto artístico.',
          'Estrategia de contenido orgánico.',
        ],
      },
      {
        id: 'm1-l5',
        position: 5,
        title: 'Monetización en plataformas digitales',
        durationMinutes: 45,
        description:
          'Mecanismos de ingresos en Spotify, Apple Music, YouTube Content ID, TikTok Music y plataformas de sincronización.',
        keyTakeaways: [
          'Cálculo de regalías por stream (Pay-per-stream).',
          'Optimizaciones de perfil de artista (Spotify for Artists, etc.).',
          'Monetización vía contenido generado por usuarios (UGC).',
        ],
      },
    ],
    resources: [
      {
        id: 'r1-1',
        title: 'Plantilla de Split Sheet de Co-autoría Legal',
        type: 'contract',
        format: 'PDF',
        size: '180 KB',
        description: 'Documento estándar para registrar porcentajes de composición entre autores y productores.',
        downloadUrl: '#',
      },
      {
        id: 'r1-2',
        title: 'Guía de Identidad y Moodboard Visual',
        type: 'template',
        format: 'FIGMA',
        size: '1.4 MB',
        description: 'Lienzo editable para definir branding sonoro, referencias visuales y estética de lanzamientos.',
        downloadUrl: '#',
      },
    ],
  },
  {
    id: 'm2-mercadeo-operaciones',
    number: 2,
    title: 'Módulo 2: Fundamentos de Mercadeo y Operaciones',
    shortTitle: 'M2: Mercadeo y Operaciones',
    estimatedHours: 15,
    description:
      'Estructura la base corporativa y operativa de tu proyecto: gestión de contratos, presupuestos detallados por rubro, organigrama de trabajo y plan de acción 360°.',
    learningObjectives: [
      'Diseñar y gestionar la documentación ejecutiva obligatoria para la contratación y alianzas.',
      'Calcular y proyectar presupuestos viables para fonogramas, shows en vivo y campañas.',
      'Coordinar la infraestructura operativa, el equipo humano y los flujos de trabajo.',
    ],
    lessons: [
      {
        id: 'm2-l1',
        position: 1,
        title: 'Herramientas de marketing tradicional y digital',
        durationMinutes: 40,
        description:
          'Embudos de conversión para oyentes, mailing para festivales, relaciones públicas y activaciones de prensa directa.',
        keyTakeaways: ['Customer Journey musical.', 'Estrategia de bases de datos de fans.', 'Cobertura de prensa especializada.'],
      },
      {
        id: 'm2-l2',
        position: 2,
        title: 'Diseño de documentación ejecutiva (contratos, bases de datos)',
        durationMinutes: 55,
        description:
          'Modelos contractuales esenciales: cesión de derechos patrimoniales, contratos de prestación de servicios, acuerdos de confidencialidad y rider técnico.',
        keyTakeaways: ['Estructura de cláusulas indispensables.', 'Manejo de NDA y acuerdos de cesión.', 'Base de datos de contactos del sector.'],
      },
      {
        id: 'm2-l3',
        position: 3,
        title: 'Presupuestos para disco, comunicación, shows, campañas',
        durationMinutes: 60,
        description:
          'Metodología financiera para costear la cadena completa: horas de estudio, diseño de packaging, pauta, transporte, staff de show y catering.',
        keyTakeaways: ['Hoja de cálculo parametrizada.', 'Cálculo de punto de equilibrio (Break-even).', 'Margen de contingencia y flujo de caja.'],
      },
      {
        id: 'm2-l4',
        position: 4,
        title: 'Estructura de equipo y organigrama',
        durationMinutes: 35,
        description:
          'Roles del equipo musical: Manager, Booking Agent, Tour Manager, Roadie, Stage Manager, PR y Abogado de Entretenimiento.',
        keyTakeaways: ['Porcentajes de comisión habituales.', 'Definición de responsabilidades y alcances.', 'Esquemas de trabajo freelance vs. fijos.'],
      },
      {
        id: 'm2-l5',
        position: 5,
        title: 'Estrategia general e investigación de mercado',
        durationMinutes: 45,
        description:
          'Análisis FODA aplicado al proyecto sonoro, benchmarking de artistas contemporáneos y detección de nichos de mercado desatendidos.',
        keyTakeaways: ['Metodología de benchmarking musical.', 'Métricas demográficas de audiencias.', 'Ventaja competitiva diferencial.'],
      },
      {
        id: 'm2-l6',
        position: 6,
        title: 'Actividad 360: comunicación, infraestructura y promoción',
        durationMinutes: 50,
        description:
          'Alineación integral de todos los frentes para que un lanzamiento sincronice merchandising, shows, contenidos y distribución.',
        keyTakeaways: ['Gantt operativo 360°.', 'Control de hitos críticos pre y post lanzamiento.', 'Checklist de contingencia operativa.'],
      },
    ],
    resources: [
      {
        id: 'r2-1',
        title: 'Plantilla Maestra de Presupuesto Musical Multi-rubro',
        type: 'budget',
        format: 'XLSX',
        size: '340 KB',
        description: 'Matriz con fórmulas automáticas para producción discográfica, shows, videoclips y pauta.',
        downloadUrl: '#',
      },
      {
        id: 'r2-2',
        title: 'Kit de Contratos Tipo: Cesión, Servicios y Management',
        type: 'contract',
        format: 'DOCX',
        size: '520 KB',
        description: 'Plantillas de contratos legales redactados bajo marco normativo de propiedad intelectual.',
        downloadUrl: '#',
      },
    ],
  },
  {
    id: 'm3-publicidad-audiovisual',
    number: 3,
    title: 'Módulo 3: Publicidad y Comunicación Audiovisual',
    shortTitle: 'M3: Publicidad Audiovisual',
    estimatedHours: 10,
    description:
      'Conceptualiza campañas publicitarias de alto impacto sensorial, explorando formatos ATL, BTL y el lenguaje audiovisual para potenciar el valor percibido del artista.',
    learningObjectives: [
      'Diferenciar y articular campañas publicitarias ATL, BTL y tácticas de guerrilla.',
      'Desarrollar el universo simbólico y conceptual de videoclips, live sessions y piezas para redes.',
      'Diseñar briefs estéticos y guiones técnicos para directores y realizadores visuales.',
    ],
    lessons: [
      {
        id: 'm3-l1',
        position: 1,
        title: 'Conceptualización ATL y BTL',
        durationMinutes: 45,
        description:
          'Estrategias masivas vs. experiencias inmersivas directas: activaciones en vivo, pop-up shows, vallas, intervenciones urbanas e intervenciones sorpresa.',
        keyTakeaways: ['Diseño de experiencias de marca.', 'Formatos de activación costo-eficientes.', 'Medición de impacto de marca.'],
      },
      {
        id: 'm3-l2',
        position: 2,
        title: 'Construcción simbólica de mensajes visuales',
        durationMinutes: 40,
        description:
          'Semiótica y narrativa audiovisual: cómo los símbolos, la indumentaria, la iluminación y los planos refuerzan el mensaje lírico y musical.',
        keyTakeaways: ['Semiótica de videoclips musicales.', 'Tratamiento de color y atmósfera estética.', 'Coherencia conceptual álbum-video.'],
      },
      {
        id: 'm3-l3',
        position: 3,
        title: 'Diseño estético de recursos digitales para promoción artística',
        durationMinutes: 50,
        description:
          'Adaptación de contenido para TikTok, Reels, Canvas de Spotify, YouTube Shorts y presskits interactivos.',
        keyTakeaways: ['Formatos y ratios de aspecto clave.', 'Ritmo de edición para retención en redes.', 'Uso estratégico de audios propios en micro-formatos.'],
      },
    ],
    resources: [
      {
        id: 'r3-1',
        title: 'Guion Técnico y Brief Audiovisual para Videoclips',
        type: 'template',
        format: 'DOCX',
        size: '220 KB',
        description: 'Estructura estándar para encargar piezas audiovisuales a productoras y directores.',
        downloadUrl: '#',
      },
    ],
  },
  {
    id: 'm4-estrategia-promocion',
    number: 4,
    title: 'Módulo 4: Estrategia de Promoción y Pauta',
    shortTitle: 'M4: Promoción y Pauta',
    estimatedHours: 12,
    description:
      'Domina la inversión inteligente en medios digitales (Meta Ads, Google/YouTube Ads, TikTok Ads) y el diseño de embudos de conversión para maximizar el ROI de cada lanzamiento.',
    learningObjectives: [
      'Segmentar presupuestos de pauta publicitaria en fases de pre-guardado, lanzamiento y sostenimiento.',
      'Cotizar y valorizar los entregables de una campaña de marketing musical.',
      'Configurar audiencias personalizadas, similares (lookalike) y píxeles de conversión.',
    ],
    lessons: [
      {
        id: 'm4-l1',
        position: 1,
        title: 'Planeación de presupuestos segmentados',
        durationMinutes: 40,
        description:
          'Distribución porcentual óptima del presupuesto de marketing: 20% Pre-release (Pre-save), 50% Launch Week, 30% Ever-green sostenimiento.',
        keyTakeaways: ['Curva de inversión en pauta.', 'Evitar sobreinversión prematura.', 'Alineación de objetivos por etapa.'],
      },
      {
        id: 'm4-l2',
        position: 2,
        title: 'Cotizaciones y valorización de producción y campaña',
        durationMinutes: 45,
        description:
          'Cómo valorar el costo por adquisición (CPA), costo por clic de salida (CPC) y costo por oyente capturado en playlists editoriales.',
        keyTakeaways: ['Métricas de rendimiento en ads (CTR, CPC, ROAS).', 'Tarifas del mercado de agencias de marketing musical.', 'Presupuestos mínimos viables.'],
      },
      {
        id: 'm4-l3',
        position: 3,
        title: 'Diseño de estrategias para públicos objetivo',
        durationMinutes: 50,
        description:
          'Creación de Buyer Personas musicales, identificación de micro-comunidades, fans de nicho y audiencias de artistas referentes.',
        keyTakeaways: ['Segmentación por gustos e intereses musicales.', 'Estrategia de retargeting a oyentes existentes.', 'Pruebas A/B de creativos visuales.'],
      },
      {
        id: 'm4-l4',
        position: 4,
        title: 'Distribución de pauta en medios y plataformas sociales',
        durationMinutes: 55,
        description:
          'Configuración técnica en Business Manager de Meta y Google Ads: campañas de tráfico con Smartlinks (Feature.fm, Linkfire, ToneDen).',
        keyTakeaways: ['Configuración de dominios y eventos de conversión.', 'Estrategias en Meta Ads para Spotify Conversion.', 'Pauta en YouTube Discovery para videoclips.'],
      },
    ],
    resources: [
      {
        id: 'r4-1',
        title: 'Calculadora de Presupuesto y ROI de Pauta Digital',
        type: 'budget',
        format: 'XLSX',
        size: '280 KB',
        description: 'Simulador para proyectar clics, pre-saves y reproducciones según el monto de inversión.',
        downloadUrl: '#',
      },
    ],
  },
  {
    id: 'm5-distribucion-negociaciones',
    number: 5,
    title: 'Módulo 5: Distribución, Sociedades de Gestión Colectiva y Negociaciones',
    shortTitle: 'M5: Distribución y Derechos',
    estimatedHours: 14,
    description:
      'Entiende el marco legal de derechos de autor y conexos, recaudación de regalías en sociedades (SAYCO, ACINPRO) y estrategias de negociación con distribuidores y sellos.',
    learningObjectives: [
      'Diferenciar las funciones entre editoras, agregadores digitales y sociedades de gestión colectiva.',
      'Registrar obras fonográficas, composiciones (ISWC e ISRC) y activar cobros retroactivos.',
      'Negociar contratos de distribución digital, acuerdos de licencia y acuerdos de patrocinio corporativo.',
    ],
    lessons: [
      {
        id: 'm5-l1',
        position: 1,
        title: 'Distribución digital y física',
        durationMinutes: 45,
        description:
          'Comparativa entre agregadores abiertos (DistroKid, TuneCore, CD Baby) vs. distribuidores boutique con servicios de sello (The Orchard, Altafonte, ONErpm, Believe).',
        keyTakeaways: ['Porcentajes de comisión vs. pago anual fijo.', 'Pitch editorial directo a curadores de plataformas.', 'Plazos de entrega y códigos UPC/ISRC.'],
      },
      {
        id: 'm5-l2',
        position: 2,
        title: 'Negociación con agregadores y patrocinadores',
        durationMinutes: 50,
        description:
          'Cláusulas clave a negociar: exclusividad territorial, reversión de derechos, adelantos (advances), compromisos de marketing y deducciones.',
        keyTakeaways: ['Estructura de un Deal de Licencia o Distribución.', 'Propuesta comercial para marcas patrocinadoras.', 'Mapeo de contraprestaciones de marca.'],
      },
      {
        id: 'm5-l3',
        position: 3,
        title: 'Canales y aplicación de sociedades de gestión colectiva',
        durationMinutes: 55,
        description:
          'Ecosistema de recaudación en Colombia y el mundo: SAYCO (Autores y Compositores), ACINPRO (Productores y Artistas Intérpretes), SoundExchange y BMI/ASCAP.',
        keyTakeaways: ['Diferencia entre derecho moral y patrimonial.', 'Registro de metadatos de fonogramas.', 'Cobro de regalías por comunicación pública y radiodifusión.'],
      },
      {
        id: 'm5-l4',
        position: 4,
        title: 'Establecimiento de rutas de monetización',
        durationMinutes: 40,
        description:
          'Mapeo de las 7 fuentes de ingreso de un artista: shows en vivo, streaming, sincronización publicitaria/audiovisual, merch, crowdfunding, patrocinios y docencia.',
        keyTakeaways: ['Diversificación del flujo de ingresos.', 'Tarifario de sincronización en cine y series.', 'Modelos de suscripción de comunidad (Patreon/Discord).'],
      },
      {
        id: 'm5-l5',
        position: 5,
        title: 'Coordinación entre lanzamientos y campañas promocionales',
        durationMinutes: 45,
        description:
          'Sincronización de fechas: entrega de master (4 semanas antes), pitch en Spotify for Artists (3 semanas antes), anuncio en prensa (1 semana antes) y lanzamiento.',
        keyTakeaways: ['Timeline ideal de 6 semanas por sencillo.', 'Protocolo para maximizar inclusión en Discover Weekly / Release Radar.', 'Mantenimiento del impulso post-lanzamiento.'],
      },
    ],
    resources: [
      {
        id: 'r5-1',
        title: 'Checklist de Registro en SAYCO & ACINPRO y Metadatos ISRC',
        type: 'document',
        format: 'PDF',
        size: '410 KB',
        description: 'Paso a paso para afiliar obras, registrar intérpretes y asegurar la trazabilidad de regalías.',
        downloadUrl: '#',
      },
    ],
  },
  {
    id: 'm6-plan-negocio-deck',
    number: 6,
    title: 'Módulo 6: Articulación y Plan de Negocio Final (Music Business Deck)',
    shortTitle: 'M6: Plan de Negocio & Deck',
    estimatedHours: 16,
    description:
      'Sintetiza todo el aprendizaje en el entregable definitivo: el Business Plan y el Pitch Deck profesional del proyecto, listo para presentar a inversionistas, marcas y fondos de financiamiento.',
    learningObjectives: [
      'Construir un cronograma operativo, workflow y manual de procedimientos del proyecto musical.',
      'Diseñar la carpeta de patrocinio y propuesta de valor para marcas comerciales.',
      'Estructurar y presentar el Music Business Deck con proyecciones financieras a 3 años.',
    ],
    lessons: [
      {
        id: 'm6-l1',
        position: 1,
        title: 'Desarrollo de cronograma, agenda y metodología operativa',
        durationMinutes: 45,
        description:
          'Organización anual del proyecto: calendario de lanzamientos, temporadas de gira, descansos creativos y asignación de responsables en Notion/Trello.',
        keyTakeaways: ['Gestión ágil de proyectos creativos.', 'Plantilla de calendario maestro de lanzamientos.', 'Hitos clave de evaluación trimestral.'],
      },
      {
        id: 'm6-l2',
        position: 2,
        title: 'Documento de workflow',
        durationMinutes: 40,
        description:
          'Estandarización de procesos: cómo se aprueba una mezcla, cómo se valida una portada, protocolo de crisis en redes y control de backups en la nube.',
        keyTakeaways: ['Flujograma de toma de decisiones.', 'Manual de estilo y directrices de marca.', 'Mantenimiento del archivo maestro y stems.'],
      },
      {
        id: 'm6-l3',
        position: 3,
        title: 'Diseño de estrategia de patrocinadores',
        durationMinutes: 50,
        description:
          'Construcción del dossier comercial para marcas: justificación demográfica de fans, paquetes de patrocinio (Oro, Plata, Bronce) y medición de activaciones.',
        keyTakeaways: ['Propuesta de valor para marcas aliadas.', 'Estructura de entregables comerciales.', 'Contrato de sponsoreo y cláusulas de exclusividad.'],
      },
      {
        id: 'm6-l4',
        position: 4,
        title: 'Construcción y cierre del Business Plan (Music Business Deck)',
        durationMinutes: 60,
        description:
          'Estructura final del Deck de Inversión: Resumen Ejecutivo, Diagnóstico de Mercado, Propuesta Artística, Estrategia de Marketing, Presupuesto y Proyección de Retorno.',
        keyTakeaways: [
          'Estructura de 12 slides del Music Business Deck.',
          'Presentación de métricas de tracción (Oyentes, Engagement, Sold-outs).',
          'Pitch efectivo ante comités de selección y fondos culturales.',
        ],
      },
    ],
    resources: [
      {
        id: 'r6-1',
        title: 'Plantilla Oficial del Music Business Deck (Pitch de Inversión)',
        type: 'deck',
        format: 'PDF',
        size: '2.8 MB',
        description: 'Presentación estructurada de 12 diapositivas con diseño corporativo para buscar financiamiento.',
        downloadUrl: '#',
      },
      {
        id: 'r6-2',
        title: 'Manual de Metodología Operativa y Workflow en Notion',
        type: 'workflow',
        format: 'NOTION',
        size: 'Enlace',
        description: 'Plantilla de espacio de trabajo para gestionar lanzamientos, tareas y catálogo musical.',
        downloadUrl: '#',
      },
    ],
  },
];

