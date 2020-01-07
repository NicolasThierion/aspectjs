export abstract class Aspect {
    id: string; // TODO Rename to 'ID'
}

export type JoinPoint = (args?: any[]) => any;
