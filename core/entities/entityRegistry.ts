import type { EntityDefinition } from './entity.types';

export class EntityRegistry {
  private readonly definitions = new Map<string, EntityDefinition>();

  register(definition: EntityDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`La entidad "${definition.type}" ya está registrada.`);
    }

    this.definitions.set(definition.type, definition);
  }

  registerMany(definitions: EntityDefinition[]): void {
    definitions.forEach((definition) => this.register(definition));
  }

  get(type: string): EntityDefinition {
    const definition = this.definitions.get(type);

    if (!definition) {
      throw new Error(`No existe una definición registrada para "${type}".`);
    }

    return definition;
  }

  has(type: string): boolean {
    return this.definitions.has(type);
  }

  getAll(): EntityDefinition[] {
    return Array.from(this.definitions.values());
  }
}

export const entityRegistry = new EntityRegistry();
