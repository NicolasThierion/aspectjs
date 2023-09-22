export abstract class DatasourceRegistry<T> {
  private registry = new Map<string, T>();
  register(datasource: T, name = 'default'): void {
    this.registry.set(name, datasource);
  }
  get(name = 'default'): T {
    const ds = this.registry.get(name);

    if (!ds) {
      throw new TypeError(`No datasource registered for ${name}`);
    }

    return ds;
  }
}
