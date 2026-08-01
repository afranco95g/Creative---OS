'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  ProjectGraph,
} from '../types/project';

import {
  compileDocument,
  getAllDocumentReadiness,
} from '../engines/documentEngine';

interface DocumentsPanelProps {
  graph: ProjectGraph;
}

export function DocumentsPanel({
  graph,
}: DocumentsPanelProps) {
  const documents =
    getAllDocumentReadiness(
      graph
    );

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState<string | null>(
    null
  );

  const selectedDocument =
    useMemo(() => {
      if (
        !selectedDocumentId
      ) {
        return null;
      }

      return compileDocument(
        graph,
        selectedDocumentId
      );
    }, [
      graph,
      selectedDocumentId,
    ]);

  function handleDownloadMarkdown(
    definitionId: string
  ) {
    const document =
      compileDocument(
        graph,
        definitionId
      );

    const fileName =
      buildFileName(
        graph.title,
        document.title
      );

    const blob =
      new Blob(
        [document.content],
        {
          type:
            'text/markdown;charset=utf-8',
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      window.document.createElement(
        'a'
      );

    link.href = url;
    link.download =
      `${fileName}.md`;

    window.document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#D9FF00]">
          Documentos vivos
        </p>

        <h1 className="text-5xl font-semibold tracking-tight text-white">
          Formatos que crecen con el proyecto
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#A6A6A6]">
          Puedes abrir y descargar cualquier documento
          aunque todavía esté incompleto. Creative OS
          utilizará la información disponible y marcará
          claramente lo que falta por definir.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {documents.map(
          (item) => {
            const isSelected =
              selectedDocumentId ===
              item.definition.id;

            return (
              <article
                key={
                  item.definition.id
                }
                className={`rounded-3xl border p-6 transition ${
                  isSelected
                    ? 'border-[#D9FF00] bg-[#15170B]'
                    : 'border-[#232323] bg-[#101010]'
                }`}
              >
                <div className="mb-5 flex items-start justify-between gap-6">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#767676]">
                      Documento vivo
                    </p>

                    <h3 className="text-xl font-semibold text-white">
                      {
                        item.definition
                          .title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-[#A6A6A6]">
                      {
                        item.definition
                          .description
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="block text-2xl font-bold text-[#D9FF00]">
                      {
                        item.readiness
                      }
                      %
                    </span>

                    <span className="mt-1 block text-xs text-[#767676]">
                      preparación
                    </span>
                  </div>
                </div>

                <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#232323]">
                  <div
                    className="h-full rounded-full bg-[#D9FF00] transition-all"
                    style={{
                      width:
                        `${item.readiness}%`,
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#767676]">
                      Ya tiene
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {item
                        .completedModules
                        .length > 0 ? (
                        item.completedModules.map(
                          (
                            moduleId
                          ) => (
                            <span
                              key={
                                moduleId
                              }
                              className="rounded-full border border-[#284221] bg-[#102010] px-3 py-1 text-xs text-[#6EEB83]"
                            >
                              ✓{' '}
                              {graph
                                .modules[
                                moduleId
                              ]?.title ||
                                moduleId}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-[#767676]">
                          Todavía no hay
                          módulos
                          suficientemente
                          desarrollados.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#767676]">
                      Falta fortalecer
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {item
                        .missingModules
                        .length > 0 ? (
                        item.missingModules.map(
                          (
                            moduleId
                          ) => (
                            <span
                              key={
                                moduleId
                              }
                              className="rounded-full border border-[#4A3D16] bg-[#201A08] px-3 py-1 text-xs text-[#FFC857]"
                            >
                              {graph
                                .modules[
                                moduleId
                              ]?.title ||
                                moduleId}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-[#6EEB83]">
                          El contenido base
                          está completo.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 border-t border-[#232323] pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocumentId(
                        isSelected
                          ? null
                          : item
                              .definition
                              .id
                      )
                    }
                    className="flex-1 rounded-full border border-[#343434] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#D9FF00] hover:text-[#D9FF00]"
                  >
                    {isSelected
                      ? 'Cerrar borrador'
                      : 'Ver borrador'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadMarkdown(
                        item
                          .definition
                          .id
                      )
                    }
                    className="flex-1 rounded-full bg-[#D9FF00] px-4 py-3 text-sm font-bold text-black transition hover:bg-white"
                  >
                    Descargar Markdown
                  </button>
                </div>
              </article>
            );
          }
        )}
      </div>

      {selectedDocument && (
        <DocumentPreview
          title={
            selectedDocument.title
          }
          readiness={
            selectedDocument.readiness
          }
          content={
            selectedDocument.content
          }
          onClose={() =>
            setSelectedDocumentId(
              null
            )
          }
          onDownload={() =>
            handleDownloadMarkdown(
              selectedDocument.definitionId
            )
          }
        />
      )}
    </section>
  );
}

interface DocumentPreviewProps {
  title: string;
  readiness: number;
  content: string;
  onClose: () => void;
  onDownload: () => void;
}

function DocumentPreview({
  title,
  readiness,
  content,
  onClose,
  onDownload,
}: DocumentPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-[#343434] bg-[#0D0D0D] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-[#232323] px-8 py-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#D9FF00]">
              Borrador actual
            </p>

            <h2 className="text-3xl font-semibold text-white">
              {title}
            </h2>

            <p className="mt-2 text-sm text-[#8A8A8A]">
              Preparación actual: {readiness}%
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDownload}
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
            >
              Descargar Markdown
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#343434] px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              Cerrar
            </button>
          </div>
        </header>

        <div className="overflow-y-auto p-8">
          <DocumentMarkdownPreview content={content} />
        </div>
      </section>
    </div>
  );
}
function DocumentMarkdownPreview({
  content,
}: {
  content: string;
}) {
  const lines = content.split('\n');

  return (
    <article className="space-y-3">
      {lines.map((line, index) => {
        const cleanLine = line.trim();

        if (!cleanLine) {
          return (
            <div
              key={index}
              className="h-2"
            />
          );
        }

        if (cleanLine === '---') {
          return (
            <hr
              key={index}
              className="my-6 border-[#2B2B2B]"
            />
          );
        }

        if (cleanLine.startsWith('# ')) {
          return (
            <h1
              key={index}
              className="mb-6 text-4xl font-semibold tracking-tight text-white"
            >
              {cleanLine.replace('# ', '')}
            </h1>
          );
        }

        if (cleanLine.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="mt-8 text-2xl font-semibold text-[#D9FF00]"
            >
              {cleanLine.replace('## ', '')}
            </h2>
          );
        }

        const isPending =
          cleanLine
            .toLowerCase()
            .startsWith(
              'pendiente por fortalecer'
            );

        if (isPending) {
          return (
            <div
              key={index}
              className="rounded-2xl border border-[#4A3D16] bg-[#201A08] px-5 py-4 text-sm leading-relaxed text-[#FFC857]"
            >
              {cleanLine}
            </div>
          );
        }

        return (
          <p
            key={index}
            className="text-base leading-8 text-[#D6D6D6]"
          >
            {cleanLine}
          </p>
        );
      })}
    </article>
  );
}
function buildFileName(
  projectTitle: string,
  documentTitle: string
): string {
  return `${projectTitle}-${documentTitle}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );
}