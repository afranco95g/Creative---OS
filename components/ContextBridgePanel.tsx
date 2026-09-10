'use client';

interface ContextBridgePanelProps {
  canExport: boolean;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}

export function ContextBridgePanel({
  canExport,
  onExportJson,
  onExportMarkdown,
}: ContextBridgePanelProps) {
  return (
    <section className="rounded-3xl border border-borde bg-superficie-elevada p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">
        Context Bridge
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-texto-largo">
        Exportar contexto
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-texto-largo">
        Descarga el estado del proyecto para continuar el trabajo con otra IA,
        una persona, una plataforma externa o una revisión humana.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExportMarkdown}
          disabled={!canExport}
          className="rounded-full bg-rojo-base px-5 py-2.5 text-sm font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-40"
        >
          Exportar Markdown
        </button>

        <button
          type="button"
          onClick={onExportJson}
          disabled={!canExport}
          className="rounded-full border border-borde bg-superficie px-5 py-2.5 text-sm font-semibold text-texto-largo transition hover:border-acento disabled:cursor-not-allowed disabled:opacity-40"
        >
          Exportar JSON
        </button>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-texto-largo">
        Markdown es ideal para compartir con una persona o una IA. JSON es
        ideal para integraciones, automatizaciones y análisis técnico.
      </p>
    </section>
  );
}