'use client';

import { useEffect, useState } from 'react';
import {
  createPortfolioItem,
  deletePortfolioItem,
  getQuoteContactPreferences,
  listPortfolioItems,
  updatePortfolioItem,
  updateQuoteContactPreferences,
  uploadPortfolioMedia,
  type PortfolioActorType,
  type PortfolioItem,
  type QuoteContactPreferences,
} from '@/services/ecosystem/portfolioService';
import {
  loadMyCloudProjects,
  type CloudProjectSummary,
} from '@/services/projects/projectCloudService';

interface Props {
  actorType: PortfolioActorType;
  actorId: string;
}

/**
 * Sección de gestión de portafolio + preferencias de contacto para
 * cotización, para el workspace de cualquier actor (espacio, funder o
 * persona). Ver specs/portafolio-productor-y-cotizacion.md.
 */
export function PortfolioManager({ actorType, actorId }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<(QuoteContactPreferences & { publicEmail: string | null }) | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [publishedProjects, setPublishedProjects] = useState<CloudProjectSummary[]>([]);
  const [graduatingProjectId, setGraduatingProjectId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [loadedItems, loadedPrefs, loadedProjects] = await Promise.all([
          listPortfolioItems(actorType, actorId),
          getQuoteContactPreferences(actorType, actorId),
          // Mismo actor activo (espacio/funder/persona) — trae solo los
          // proyectos de este actor que el usuario autenticado administra.
          loadMyCloudProjects(actorId, actorType).catch(() => [] as CloudProjectSummary[]),
        ]);
        if (cancelled) return;
        setItems(loadedItems);
        setPrefs(loadedPrefs);
        setPublishedProjects(loadedProjects.filter((p) => p.workflowStatus === 'published'));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No fue posible cargar el portafolio.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [actorType, actorId]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let mediaUrls: string[] = [];
      if (file) {
        const url = await uploadPortfolioMedia(file);
        mediaUrls = [url];
      }
      const created = await createPortfolioItem({
        actorType,
        actorId,
        title: title.trim(),
        description: description.trim() || null,
        mediaUrls,
      });
      setItems((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible agregar el item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGraduateProject(project: CloudProjectSummary) {
    setGraduatingProjectId(project.id);
    setError(null);
    try {
      const created = await createPortfolioItem({
        actorType,
        actorId,
        title: project.title,
        description: project.description || null,
        mediaUrls: [],
        source: 'project',
        linkedProjectId: project.id,
      });
      setItems((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible graduar el proyecto.');
    } finally {
      setGraduatingProjectId(null);
    }
  }

  async function handleToggleStatus(item: PortfolioItem) {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await updatePortfolioItem(item.id, { status: nextStatus });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el item.');
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deletePortfolioItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible borrar el item.');
    }
  }

  async function handleSavePrefs() {
    if (!prefs) return;
    setSavingPrefs(true);
    setError(null);
    try {
      await updateQuoteContactPreferences(actorType, actorId, prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar las preferencias.');
    } finally {
      setSavingPrefs(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
        <p className="text-sm text-texto-largo">Cargando portafolio…</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
      <p className="text-xs uppercase text-texto-largo">Portafolio y cotización</p>
      <h3 className="mt-3 text-2xl font-semibold">Galería pública y contacto</h3>
      <p className="mt-3 text-sm leading-6 text-texto-largo">
        Los items publicados aquí rotan 3 por día en tu perfil público. También puedes marcar cómo te contactan
        para pedir una cotización.
      </p>

      {error ? <p className="mt-4 text-sm text-rojo-base">{error}</p> : null}

      {/* Preferencias de contacto */}
      {prefs ? (
        <div className="mt-6 rounded-2xl border border-borde/15 bg-superficie p-5">
          <p className="text-sm font-semibold text-hueso">Canales para &quot;Solicitar cotización&quot;</p>

          <label className="mt-4 flex items-center gap-3 text-sm text-texto-largo">
            <input
              type="checkbox"
              checked={prefs.emailEnabled}
              onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
            />
            Correo {prefs.publicEmail ? `(${prefs.publicEmail})` : '(configura tu correo público primero)'}
          </label>

          <label className="mt-3 flex items-center gap-3 text-sm text-texto-largo">
            <input
              type="checkbox"
              checked={prefs.whatsappEnabled}
              onChange={(e) => setPrefs({ ...prefs, whatsappEnabled: e.target.checked })}
            />
            WhatsApp
          </label>

          {prefs.whatsappEnabled ? (
            <input
              type="text"
              value={prefs.whatsappNumber ?? ''}
              onChange={(e) => setPrefs({ ...prefs, whatsappNumber: e.target.value })}
              placeholder="Número de WhatsApp, con indicativo de país"
              className="mt-3 w-full max-w-sm rounded-xl border border-borde/15 bg-superficie px-4 py-2 text-sm text-hueso placeholder:text-texto-largo/50 focus:outline-none focus:border-texto-principal"
            />
          ) : null}

          <button
            type="button"
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            className="mt-4 rounded-full bg-rojo-base px-5 py-2 text-sm font-bold text-hueso disabled:opacity-50"
          >
            {savingPrefs ? 'Guardando…' : 'Guardar preferencias'}
          </button>
        </div>
      ) : null}

      {/* Lista de items */}
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm italic text-texto-largo">Todavía no hay items en tu portafolio.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borde/15 bg-superficie p-4"
            >
              <div>
                <p className="text-sm font-semibold text-hueso">{item.title}</p>
                <p className="text-xs text-texto-largo">
                  {item.status === 'published' ? 'Publicado' : 'Borrador'}
                  {item.source === 'project' ? ' · desde un proyecto' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  className="rounded-full border border-borde/20 px-4 py-2 text-xs font-semibold text-hueso"
                >
                  {item.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full border border-borde/20 px-4 py-2 text-xs font-semibold text-rojo-base"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Graduar un proyecto propio publicado y exitoso a la galería */}
      {(() => {
        const linkedProjectIds = new Set(
          items.filter((i) => i.source === 'project').map((i) => i.linkedProjectId)
        );
        const graduable = publishedProjects.filter((p) => !linkedProjectIds.has(p.id));

        if (graduable.length === 0) return null;

        return (
          <div className="mt-6 rounded-2xl border border-borde/15 bg-superficie p-5">
            <p className="text-sm font-semibold text-hueso">Graduar un proyecto exitoso</p>
            <p className="mt-2 text-xs leading-5 text-texto-largo">
              Un proyecto tuyo que se lanzó y publicó en el ecosistema puede pasar a tu portafolio.
            </p>

            <div className="mt-4 space-y-2">
              {graduable.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borde/15 bg-superficie-elevada p-3"
                >
                  <p className="text-sm text-hueso">{project.title}</p>
                  <button
                    type="button"
                    onClick={() => handleGraduateProject(project)}
                    disabled={graduatingProjectId === project.id}
                    className="rounded-full border border-borde/20 px-4 py-2 text-xs font-semibold text-hueso disabled:opacity-50"
                  >
                    {graduatingProjectId === project.id ? 'Agregando…' : 'Agregar a la galería'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Formulario para agregar un item nuevo */}
      <form onSubmit={handleAddItem} className="mt-6 max-w-lg space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del item"
          disabled={saving}
          className="w-full rounded-xl border border-borde/15 bg-superficie px-4 py-2 text-sm text-hueso placeholder:text-texto-largo/50 focus:outline-none focus:border-texto-principal"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          disabled={saving}
          rows={3}
          className="w-full rounded-xl border border-borde/15 bg-superficie px-4 py-2 text-sm text-hueso placeholder:text-texto-largo/50 focus:outline-none focus:border-texto-principal"
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={saving}
          className="w-full text-xs text-texto-largo"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="rounded-full bg-rojo-base px-5 py-2 text-sm font-bold text-hueso disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Agregar al portafolio'}
        </button>
      </form>
    </section>
  );
}
