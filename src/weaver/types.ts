export abstract class Aspect {
    name: string; // Rename to 'ID'
}

export type JoinPoint = (args?: any[]) => any;
