/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type AspectType = object & {
    onEnable?: () => void;
    onDisable?: () => void;
};
