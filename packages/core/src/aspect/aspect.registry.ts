import {
  ConstructorType,
  defineMetadata,
  getMetadata,
  getPrototype,
} from '@aspectjs/common/utils';
import type { AspectOptions } from './aspect-options.type';
import type { AspectType } from './aspect.type';

let _globalId = 0;
export class AspectRegistry {
  private readonly _id = _globalId++;

  private readonly _ASPECT_OPTIONS_REFLECT_KEY = `aspectjs::aspectReg=${this._id}`;

  isAspect(aspect: ConstructorType): boolean {
    return !!this.__getAspectOptions(aspect);
  }

  getAspectOptions(aspect: ConstructorType): AspectOptions {
    this._assertIsAspect(aspect);
    return this.__getAspectOptions(aspect)!;
  }

  private __getAspectOptions(
    aspect: ConstructorType,
  ): AspectOptions | undefined {
    if (!aspect) {
      return;
    }
    const proto = getPrototype(aspect);

    return proto
      ? getMetadata(this._ASPECT_OPTIONS_REFLECT_KEY, proto)
      : undefined;
  }

  private _assertIsAspect(aspect: ConstructorType) {
    if (!this.isAspect(aspect)) {
      const proto = getPrototype(aspect);
      throw new TypeError(`${proto.constructor.name} is not an Aspect`);
    }
  }

  register(aspect: ConstructorType<AspectType>, aspectOptions: AspectOptions) {
    defineMetadata(
      this._ASPECT_OPTIONS_REFLECT_KEY,
      aspectOptions,
      getPrototype(aspect),
    );
  }
}
