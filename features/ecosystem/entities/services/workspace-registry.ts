import {
  getAllEntityConfigs,
} from '../config';

export class WorkspaceRegistry {
  getNavigation() {
    return getAllEntityConfigs()
      .filter(
        (entity) => entity.navigation?.show,
      )
      .sort(
        (a, b) =>
          (a.navigation?.order ?? 999) -
          (b.navigation?.order ?? 999),
      );
  }

  getDashboard() {
    return getAllEntityConfigs().filter(
      (entity) => entity.dashboard?.show,
    );
  }

  getEntity(entity: string) {
    return getAllEntityConfigs().find(
      (item) => item.entity === entity,
    );
  }
}

export const workspaceRegistry =
  new WorkspaceRegistry();