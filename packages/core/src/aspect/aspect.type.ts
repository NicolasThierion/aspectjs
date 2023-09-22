export const ASPECT_ID_SYMBOL = Symbol.for('aspectjs:aspectId');

export type AspectType = object & {
  [ASPECT_ID_SYMBOL]?: string;
};
