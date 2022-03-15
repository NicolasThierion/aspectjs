type LocatableType =
  | Record<string | number | symbol, any>
  | Map<string | number | symbol, any>;

/**
 * Null-safe navigation through object properties, that allows to generate missing properties on the fly.
 *
 * @public
 */
export class Locator<U extends LocatableType> {
  constructor(
    private _obj: U,
    private _parent?: Locator<any>,
    private _parentKey?: string | number | symbol
  ) {}

  /**
   * Descend to the given property of the object.
   * @param propertyName - the property to access to.
   */
  at<K extends keyof U>(
    propertyName: K,
    valueProvider?: () => U[K]
  ): U[K] extends Map<any, any> ? Locator<any> : Locator<U[K]> {
    const value =
      (this._obj
        ? this._obj instanceof Map
          ? this._obj.get(propertyName)
          : this._obj[propertyName]
        : undefined) ?? valueProvider?.();
    return new Locator(value, this, propertyName) as any;
  }

  /**
   * Get the property value
   * @returns the property value (can be null)
   */
  get(): U {
    return this._obj;
  }

  /**
   * Get the property value, or generate a new one with the given value providers.
   * @returns the property value
   */
  getOrCompute(): U {
    this._parent?._patch(this._obj, this._parentKey!);
    return this._obj;
  }

  private _patch<K extends keyof U>(value: U[K], key: K) {
    if (!this._obj) {
      this._obj = {} as U;
      if (this._parent) {
        this._parent._patch(this._obj, this._parentKey!);
      }
    }
    if (this._obj instanceof Map) {
      this._obj.set(key, value);
    } else {
      this._obj[key] = value;
    }
  }
}

/**
 * @param obj - the object to navigate through.
 *
 * @public
 */
export function locator<U extends Map<string | symbol | number, unknown>>(
  obj: U
): Locator<any>;
export function locator<U>(obj: U): Locator<U>;
export function locator<U = unknown>(obj: U): Locator<U> {
  return new Locator(obj);
}
