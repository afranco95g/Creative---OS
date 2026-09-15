// Motor de preparación (checklist Legal + Mercadeo) — spec:
// specs/preparacion-checklist-legal-mercadeo.md
//
// Determinista puro: la plantilla es fija, el usuario marca el estado a
// mano, y el resumen es aritmética simple sobre esos estados. Cero
// inferencia sobre si el proyecto "realmente" está preparado.

import { createId } from '../core/projectEngine';
import type {
  PreparednessArea,
  PreparednessChecklistItem,
  PreparednessStatus,
} from '../types/project';

interface PreparednessTemplateItem {
  area: PreparednessArea;
  title: string;
  description: string;
}

// Ítems fijos de la plantilla universal (spec 5). El texto de estos ítems
// no es editable por el usuario — ver spec 4, "fuera de alcance".
export const PREPAREDNESS_CHECKLIST_TEMPLATE: PreparednessTemplateItem[] = [
  {
    area: 'legal',
    title: 'Estructura legal definida',
    description: 'Persona natural, jurídica o figura asociativa bajo la cual el proyecto opera y contrata.',
  },
  {
    area: 'legal',
    title: 'Contratos con el equipo',
    description: 'Acuerdos escritos con las personas que ejecutan el proyecto, con roles y condiciones claras.',
  },
  {
    area: 'legal',
    title: 'Derechos de autor / propiedad intelectual',
    description: 'Titularidad y condiciones de uso definidas para las obras, la marca o los contenidos que genera el proyecto.',
  },
  {
    area: 'legal',
    title: 'Permisos y licencias',
    description: 'Autorizaciones, licencias de espacio o de uso de contenido que el proyecto necesita para operar legalmente.',
  },
  {
    area: 'mercadeo',
    title: 'Público objetivo definido',
    description: 'Quién es el público o cliente al que se dirige el proyecto y qué lo caracteriza.',
  },
  {
    area: 'mercadeo',
    title: 'Identidad visual lista',
    description: 'Logo, colores y piezas gráficas básicas que representan el proyecto de forma consistente.',
  },
  {
    area: 'mercadeo',
    title: 'Plan de difusión',
    description: 'Canales y momentos en los que el proyecto se va a comunicar públicamente.',
  },
  {
    area: 'mercadeo',
    title: 'Materiales de presentación (one-pager/portfolio)',
    description: 'Documento o portafolio listo para mostrar el proyecto a un tercero.',
  },
];

// Genera los 8 ítems del checklist para un proyecto nuevo, cada uno con su
// propio id. Dos llamadas producen ids distintos (createId() no es
// determinista) — es aceptable: cada proyecto tiene sus propios ids, y el
// contrato observable es la lista de 8 ítems en 'pendiente', no un id fijo.
export function seedPreparednessChecklist(): PreparednessChecklistItem[] {
  return PREPAREDNESS_CHECKLIST_TEMPLATE.map((item) => ({
    id: createId(),
    area: item.area,
    title: item.title,
    description: item.description,
    status: 'pendiente' as PreparednessStatus,
    note: '',
  }));
}

export function getPreparednessSummary(items: PreparednessChecklistItem[]): {
  legalReadiness: number;
  mercadeoReadiness: number;
  overallReadiness: number;
} {
  const readinessFor = (area: PreparednessArea) => {
    const areaItems = items.filter((item) => item.area === area);
    if (areaItems.length === 0) return 0;
    const listos = areaItems.filter((item) => item.status === 'listo').length;
    return Math.round((listos / areaItems.length) * 100);
  };

  const listosTotal = items.filter((item) => item.status === 'listo').length;

  return {
    legalReadiness: readinessFor('legal'),
    mercadeoReadiness: readinessFor('mercadeo'),
    overallReadiness: items.length === 0 ? 0 : Math.round((listosTotal / items.length) * 100),
  };
}
