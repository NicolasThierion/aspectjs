import { ReflectModuleConfiguration } from './reflect-module-config.type';

export const ReflectModule = function ReflectModule(
  config: ReflectModuleConfiguration,
) {
  return function (target: any) {
    target[Symbol.for('@ajs:rmd')] = config;

    return target;
  } satisfies ClassDecorator;
};
