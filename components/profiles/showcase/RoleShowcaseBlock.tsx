import { ImpactMetricsShowcase } from './ImpactMetricsShowcase';

// Roles de producción/gestión del vocabulario real de people.roles
// (migración 002 + 050) — no se inventan roles que no existen en la
// base de datos.
const METRICS_ROLES = ['producer', 'manager', 'cultural_manager', 'space_manager'];

interface RoleShowcaseBlockProps {
  roles: string[];
  publishedProjectCount: number;
}

/**
 * Decide qué bloque de vitrina mostrar según el rol de la persona
 * (Paso 4 del diseño aprobado, 2026-09-18). Los showcases por tipo de
 * medio (audio/documento) se resuelven por ítem de portafolio — ver
 * PortfolioCard en la página de perfil — no por rol, porque una
 * persona con un mismo rol puede subir distintos tipos de archivo.
 * Este bloque cubre solo lo que sí depende del rol: las métricas de
 * impacto.
 */
export function RoleShowcaseBlock({ roles, publishedProjectCount }: RoleShowcaseBlockProps) {
  const showsMetrics = roles.some((role) => METRICS_ROLES.includes(role));
  if (!showsMetrics) return null;

  return <ImpactMetricsShowcase publishedProjectCount={publishedProjectCount} />;
}
