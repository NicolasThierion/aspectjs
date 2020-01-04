export abstract class Aspect {
    name: string; // TODO Rename to 'ID'
}

export type JoinPoint = (args?: any[]) => any;
