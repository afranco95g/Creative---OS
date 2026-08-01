import {
  ContextExportFormat,
  CreativeContextPackage,
  SessionHandoff,
} from '../types/contextBridge';

export interface SerializedContext {
  content: string;
  mimeType: string;
  fileExtension: 'json' | 'md';
}

export function serializeContextPackage(
  contextPackage: CreativeContextPackage,
  format: ContextExportFormat
): SerializedContext {
  if (format === 'markdown') {
    return {
      content: serializeToMarkdown(contextPackage),
      mimeType: 'text/markdown;charset=utf-8',
      fileExtension: 'md',
    };
  }

  return {
    content: JSON.stringify(contextPackage, null, 2),
    mimeType: 'application/json;charset=utf-8',
    fileExtension: 'json',
  };
}

function serializeToMarkdown(
  contextPackage: CreativeContextPackage
): string {
  const {
    metadata,
    project,
    conversation,
    executiveState,
    graph,
    handoff,
  } = contextPackage;

  const conversationSection =
    conversation.messages.length > 0
      ? conversation.messages
          .map((message, index) => {
            const role = getMessageRoleLabel(message.role);

            return [
              `## Mensaje ${index + 1} · ${role}`,
              '',
              String(message.content),
            ].join('\n');
          })
          .join('\n\n---\n\n')
      : 'Todavía no hay mensajes registrados.';

  return [
    '# Creative OS Context Package',
    '',
    '> Paquete universal de contexto generado por Creative OS.',
    '',
    '---',
    '',
    '# Metadatos',
    '',
    `- ID: ${metadata.id}`,
    `- Generado: ${metadata.generatedAt}`,
    `- Versión del formato: ${metadata.formatVersion}`,
    `- Fuente: ${metadata.source}`,
    `- Profundidad: ${metadata.exportDepth}`,
    '',
    '---',
    '',
    '# Proyecto',
    '',
    `- Nombre: ${project.title}`,
    `- Categoría: ${project.category}`,
    `- Etapa: ${project.stage}`,
    `- Progreso: ${project.progress}%`,
    `- Creado: ${project.createdAt}`,
    `- Actualizado: ${project.updatedAt}`,
    '',
    '## Descripción',
    '',
    project.description || 'Sin descripción.',
    '',
    '---',
    '',
    '# Estado ejecutivo',
    '',
    '## Resumen',
    '',
    executiveState.summary,
    '',
    '## Prioridad actual',
    '',
    executiveState.currentPriority,
    '',
    '## Preguntas abiertas',
    '',
    formatList(
      executiveState.openQuestions,
      'No hay preguntas abiertas registradas.'
    ),
    '',
    '## Riesgos',
    '',
    formatList(
      executiveState.risks,
      'No hay riesgos registrados.'
    ),
    '',
    '## Siguientes pasos',
    '',
    formatList(
      executiveState.nextSteps,
      'No hay siguientes pasos registrados.'
    ),
    '',
    handoff
      ? serializeHandoffToMarkdown(handoff)
      : '',
    '',
    '---',
    '',
    '# ProjectGraph',
    '',
    '```json',
    JSON.stringify(graph, null, 2),
    '```',
    '',
    '---',
    '',
    `# Conversación (${conversation.totalMessages} mensajes)`,
    '',
    conversationSection,
    '',
    '---',
    '',
    '# Instrucción de continuidad',
    '',
    'Utiliza este paquete como contexto fuente. Distingue entre hechos, hipótesis, decisiones y preguntas abiertas. No inventes información ausente. Explica cualquier recomendación y conserva la intención original del proyecto.',
  ]
    .filter(Boolean)
    .join('\n');
}

function serializeHandoffToMarkdown(
  handoff: SessionHandoff
): string {
  return [
    '---',
    '',
    '# Session Handoff',
    '',
    `- ID de sesión: ${handoff.sessionId}`,
    `- Generado: ${handoff.generatedAt}`,
    `- Destino: ${handoff.intent.destination}`,
    '',
    '## Objetivo de continuidad',
    '',
    handoff.intent.objective ||
      'No se definió un objetivo.',
    '',
    '## Pregunta principal',
    '',
    handoff.intent.primaryQuestion ||
      'No se definió una pregunta principal.',
    '',
    '## Resultado esperado',
    '',
    handoff.intent.expectedOutput ||
      'No se definió un resultado esperado.',
    '',
    '## Restricciones',
    '',
    formatList(
      handoff.intent.constraints,
      'No hay restricciones registradas.'
    ),
    '',
    '## Criterios de éxito',
    '',
    formatList(
      handoff.intent.successCriteria,
      'No hay criterios de éxito registrados.'
    ),
    '',
    '## Cambios recientes',
    '',
    formatList(
      handoff.changes.map(
        (change) => `${change.type}: ${change.summary}`
      ),
      'No hay cambios recientes registrados.'
    ),
    '',
    '## Decisiones',
    '',
    formatList(
      handoff.decisions.map((decision) => {
        const status = decision.isConfirmed
          ? 'Confirmada'
          : 'Pendiente';

        return `${status}: ${decision.summary}`;
      }),
      'No hay decisiones registradas.'
    ),
    '',
    '## Hipótesis',
    '',
    formatList(
      handoff.hypotheses,
      'No hay hipótesis registradas.'
    ),
    '',
    '## Preguntas abiertas',
    '',
    formatList(
      handoff.openQuestions,
      'No hay preguntas abiertas registradas.'
    ),
    '',
    '## Bloqueos',
    '',
    formatList(
      handoff.blockers,
      'No hay bloqueos registrados.'
    ),
    '',
    '## Riesgos',
    '',
    formatList(
      handoff.risks,
      'No hay riesgos registrados.'
    ),
    '',
    '## Próxima prioridad',
    '',
    handoff.nextPriority ||
      'No se definió una próxima prioridad.',
    '',
    '## Siguiente sprint',
    '',
    handoff.nextSprint ||
      'No se definió un siguiente sprint.',
    '',
    '## Instrucciones para continuar',
    '',
    formatList(
      handoff.continuationInstructions,
      'No hay instrucciones registradas.'
    ),
  ].join('\n');
}

function formatList(
  items: string[],
  emptyMessage: string
): string {
  if (items.length === 0) {
    return emptyMessage;
  }

  return items
    .map((item) => `- ${item}`)
    .join('\n');
}

function getMessageRoleLabel(role: string): string {
  if (role === 'user') return 'Usuario';
  if (role === 'assistant') {
    return 'Productor Ejecutivo';
  }

  if (role === 'system') return 'Sistema';

  return role;
}