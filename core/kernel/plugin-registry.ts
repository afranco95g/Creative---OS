import type { KernelPlugin } from './plugin';

class PluginRegistry {
  private readonly plugins = new Map<
    string,
    KernelPlugin
  >();

  register(plugin: KernelPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(
        `Plugin "${plugin.id}" ya está registrado.`
      );
    }

    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): KernelPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): KernelPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }
}

export const pluginRegistry =
  new PluginRegistry();