import { workspaceStore } from './workspaceStore';
import { cloudProjectToWorkspaceProject, loadMyCloudProjects, syncLocalProjectsToCloud } from '../services/projects/projectCloudService';

export type PersistenceStatus = 'idle' | 'recovering' | 'saving' | 'saved' | 'offline' | 'error' | 'resolved';
type Listener = (status: PersistenceStatus, message: string) => void;
const QUEUE_PREFIX = 'creative-os-sync-queue:';

class PersistenceCoordinator {
  private userId: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;
  private suppress = false;
  private listeners = new Set<Listener>();
  private status: PersistenceStatus = 'idle';
  private message = '';

  subscribe(listener: Listener) { this.listeners.add(listener); listener(this.status, this.message); return () => { this.listeners.delete(listener); }; }
  getStatus() { return { status: this.status, message: this.message }; }

  start(userId: string) {
    if (this.userId === userId && this.unsubscribe) return;
    this.stop(); this.userId = userId;
    this.unsubscribe = workspaceStore.subscribe(() => { if (!this.suppress) this.schedule(); });
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    this.setStatus('recovering', 'Recuperando cambios…');
    this.schedule(0);
  }

  stop() {
    this.unsubscribe?.(); this.unsubscribe = null;
    if (this.timer) clearTimeout(this.timer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (typeof window !== 'undefined') { window.removeEventListener('online', this.handleOnline); window.removeEventListener('beforeunload', this.handleBeforeUnload); }
    this.userId = null;
  }

  retry() { this.schedule(0); }

  private schedule(delay = 700) {
    if (!this.userId) return;
    this.markPending();
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  private async flush() {
    if (this.syncing || !this.userId) return;
    if (!navigator.onLine) { this.setStatus('offline', 'Sin conexión. Cambios pendientes.'); return; }
    const snapshot = workspaceStore.getSnapshot();
    if (!snapshot.actors.length) { this.timer = setTimeout(() => void this.flush(), 400); return; }
    const wasRecovering = this.status === 'recovering' || this.status === 'offline' || this.status === 'error';
    this.syncing = true; this.setStatus('saving', 'Guardando…');
    try {
      const allRemote = [];
      for (const actor of snapshot.actors) {
        const result = await syncLocalProjectsToCloud(snapshot.projects, actor.id, actor.type);
        allRemote.push(...result.projects);
      }
      if (!snapshot.projects.length) allRemote.push(...await loadMyCloudProjects());
      this.suppress = true;
      workspaceStore.mergeCloudProjects(allRemote.map(cloudProjectToWorkspaceProject));
      this.suppress = false;
      this.clearPending();
      this.setStatus(wasRecovering ? 'resolved' : 'saved', wasRecovering ? 'Sincronización resuelta.' : 'Guardado.');
    } catch (error) {
      this.suppress = false;
      this.setStatus('error', error instanceof Error ? `Error al guardar: ${error.message}` : 'Error al guardar. Reintentar.');
      this.retryTimer = setTimeout(() => void this.flush(), 5000);
    } finally { this.syncing = false; }
  }

  private setStatus(status: PersistenceStatus, message: string) { this.status = status; this.message = message; this.listeners.forEach((listener) => listener(status, message)); }
  private queueKey() { return `${QUEUE_PREFIX}${this.userId}`; }
  private markPending() { try { localStorage.setItem(this.queueKey(), new Date().toISOString()); } catch {} }
  private clearPending() { try { localStorage.removeItem(this.queueKey()); } catch {} }
  private hasPending() { try { return Boolean(localStorage.getItem(this.queueKey())); } catch { return false; } }
  private handleOnline = () => { this.setStatus('recovering', 'Recuperando cambios…'); this.schedule(0); };
  private handleBeforeUnload = (event: BeforeUnloadEvent) => { if (this.hasPending()) { event.preventDefault(); event.returnValue = ''; } };
}

export const persistenceCoordinator = new PersistenceCoordinator();
