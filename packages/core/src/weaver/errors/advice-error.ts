import { Advice } from '../advices/types';

export class AdviceError extends Error {
    constructor(advice: Advice, message: string) {
        super(`${advice}: ${message}`);
    }
}
