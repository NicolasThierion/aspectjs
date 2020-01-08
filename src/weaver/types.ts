export abstract class Aspect {
    id: string;
}

export type JoinPoint = (args?: any[]) => any;
