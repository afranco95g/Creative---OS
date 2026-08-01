import type {
  KernelPlugin,
  KernelService,
} from './plugin';

import type {
  ServiceToken,
} from './service-token';

import { pluginRegistry } from './plugin-registry';

export class Kernel {
  private initialized = false;

  private readonly services =
    new Map<ServiceToken<unknown>, unknown>();

  register(
    plugin: KernelPlugin
  ): void {
    if (this.initialized) {
      throw new Error(
        'No se pueden registrar plugins después de inicializar el Kernel.'
      );
    }

    pluginRegistry.register(plugin);
  }

  registerMany(
    plugins: KernelPlugin[]
  ): void {
    plugins.forEach((plugin) => {
      this.register(plugin);
    });
  }

  registerService<T>(
    token: ServiceToken<T>,
    service: T
  ): void {
    if (this.services.has(token)) {
      throw new Error(
        `El servicio "${token.description ?? 'desconocido'}" ya está registrado en el Kernel.`
      );
    }

    this.services.set(
      token,
      service
    );
  }

  private registerPluginServices(
    services: KernelService[] = []
  ): void {
    services.forEach((service) => {
      this.registerService(
        service.token,
        service.instance
      );
    });
  }

  getService<T>(
    token: ServiceToken<T>
  ): T {
    const service =
      this.services.get(token);

    if (service === undefined) {
      throw new Error(
        `El servicio "${token.description ?? 'desconocido'}" no está registrado en el Kernel.`
      );
    }

    return service as T;
  }

  resolve<T>(
    token: ServiceToken<T>
  ): T {
    return this.getService(token);
  }

  hasService<T>(
    token: ServiceToken<T>
  ): boolean {
    return this.services.has(token);
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    const plugins = pluginRegistry
      .getAll()
      .sort(
        (a, b) =>
          (a.priority ?? 100) -
          (b.priority ?? 100)
      );

    plugins.forEach((plugin) => {
      this.registerPluginServices(
        plugin.services
      );

      plugin.register(this);
    });

    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPlugins(): KernelPlugin[] {
    return pluginRegistry.getAll();
  }
}

export const kernel = new Kernel();