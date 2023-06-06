function typeOf(val: any): string {
  if (typeof val === 'object') {
    return Object.getPrototypeOf(val).constructor.name;
  }

  return typeof val;
}

export function cloneDeep(obj: any) {
  return _cloneDeep(obj, new Set());
}

function _cloneDeep<T>(obj: T, exclusions: Set<unknown>): T {
  if (typeof obj === 'object') {
    if (exclusions.has(obj)) {
      return obj;
    }

    exclusions.add(obj);

    switch (typeOf(obj)) {
      case 'Array':
        return cloneArrayDeep(obj as any, exclusions) as any;
      case 'Map':
        return cloneMapDeep(obj as any, exclusions) as any;
      case 'Set':
        return cloneSetDeep(obj as any, exclusions) as any;
      case 'Date':
        return new Date(obj as any) as any;
      default: {
        return _cloneDeepObject(obj, exclusions);
      }
    }
  }

  return obj;
}

function cloneMapDeep<K, V>(obj: Map<K, V>, exclusions: Set<unknown>) {
  const map = new Map<K, V>();
  obj.forEach((val, key) => map.set(key, _cloneDeep(val, exclusions)));

  return map;
}

function cloneSetDeep<V>(obj: Set<V>, exclusions: Set<unknown>) {
  const set = new Set<V>();
  obj.forEach((val) => set.add(_cloneDeep(val, exclusions)));

  return set;
}

function _cloneDeepObject<T>(obj: T, exclusions: Set<unknown>): T {
  if (typeof obj !== 'object') {
    return obj;
  }

  const clone = {} as T;
  for (const key in obj) {
    clone[key] = _cloneDeep(obj[key], exclusions);
  }

  Object.setPrototypeOf(clone, Object.getPrototypeOf(obj));
  return clone;
}

function cloneArrayDeep<T>(val: T[], exclusions: Set<unknown>): T[] {
  const res = new Array(val.length);
  for (let i = 0; i < val.length; i++) {
    res[i] = _cloneDeep(val[i], exclusions);
  }
  return res;
}
