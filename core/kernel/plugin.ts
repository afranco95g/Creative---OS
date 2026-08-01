import type { Kernel } from './kernel';
import type { ServiceToken } from './service-token';

export interface KernelService<T = unknown> {

  token: ServiceToken<T>;

  instance: T;

}

export interface KernelPlugin {

  id: string;

  name: string;

  priority?: number;

  services?: KernelService[];

  register(
    kernel: Kernel
  ): void;

}