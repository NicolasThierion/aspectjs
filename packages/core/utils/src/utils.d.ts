export declare function __setDebug(debug: boolean): void;
export declare type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};
export declare function assert(condition: boolean, errorProvider?: () => Error): void;
export declare function assert(condition: boolean, msg?: string): void;
export declare function getMetaOrDefault<T>(key: string, target: any, valueGenerator: () => T, save?: boolean, propertyKey?: string): T;
export declare function getOrDefault<U extends Record<string, any>, K extends keyof U>(obj: U, key: K, valueProvider: () => U[K], save?: boolean): U[K];
export declare function getOrDefault<T>(obj: any[], key: number, valueProvider: () => T, save?: boolean): T;
export declare function getProto(target: Record<string, any> | Function): Record<string, any>;
export declare function isObject(value: any): value is object;
export declare function isArray(value: any): value is any[];
export declare function isString(value: any): value is string;
export declare function isUndefined(value: any): value is undefined;
export declare function isFunction(value: any): value is (...args: any[]) => any;
export declare function isNumber(value: any): value is number;
export declare function isEmpty(value: any): boolean;
export declare function clone<T>(obj: T): T;
export declare function isPromise(obj: any): obj is Promise<any>;
export declare function provider<T, A>(arg: T | ((a: A) => T)): (a?: A) => T;
//# sourceMappingURL=utils.d.ts.map