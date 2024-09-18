import {
  AbstractToken,
  ConstructorType,
  getPrototype,
  isAbstractToken,
} from '@aspectjs/common/utils';
import { AfterReturnContext, PointcutKind } from '@aspectjs/core';
import { TypeHint } from '../annotations/type-hint.annotation';
import { MapperError } from '../types/mapper.error';
import { MapperContext } from '../types/mapper.type';
import { ResponseHandler } from '../types/response-handler.type';
import { TypeHintType } from '../types/type-hint.type';

export const MAP_JSON_RESPONSE_HANDLER: ResponseHandler = async (
  response,
  config,
  ctxt,
) => {
  if (!response.ok) {
    return response;
  }
  const body = await response.json();

  if (body) {
    const typeHint = await _findTypeHint(ctxt);

    const context: MapperContext = {
      mappers: config.responseBodyMappers,
      data: {},
    };

    if (Array.isArray(body)) {
      return _arrayToMappedType(body, context, typeHint);
    } else {
      if (Array.isArray(typeHint)) {
        throw new MapperError(
          body,
          typeHint,
          `Mapper expected an array, but got ${
            Object.getPrototypeOf(body).constructor.name
          }`,
        );
      }
      const mapper = config.responseBodyMappers.findMapper(typeHint);
      return mapper ? await mapper.map(body, context) : body;
    }
  }

  return body;
};
async function _findTypeHint(
  ctxt: AfterReturnContext<PointcutKind.METHOD>,
): Promise<TypeHintType | TypeHintType[]> {
  return ctxt.target.getMetadata<Promise<TypeHintType | TypeHintType[]>>(
    'ajs.httyped-client:response-typeHint',
    async () => {
      const typeAnnotation = ctxt
        .annotations(TypeHint)
        .find({ searchParents: true })[0];

      if (typeAnnotation) {
        return typeAnnotation.args[0];
      }

      const returnValue = await ctxt.value;
      const abstractTokenTemplate = isAbstractToken(returnValue)
        ? (returnValue as AbstractToken).template
        : undefined;

      if (
        abstractTokenTemplate !== undefined &&
        abstractTokenTemplate !== null
      ) {
        return Array.isArray(abstractTokenTemplate)
          ? _arrayToTypeArray(abstractTokenTemplate)
          : (getPrototype(abstractTokenTemplate).constructor as any);
      }
    },
  );
}

function _arrayToTypeArray<T = unknown>(array: T[]): ConstructorType<T>[] {
  return array.map((t) => {
    return Array.isArray(t)
      ? _arrayToTypeArray(t)
      : (getPrototype(t as any).constructor as any);
  });
}

async function _arrayToMappedType<T = unknown, U = unknown>(
  array: (T | Promise<T>)[],
  context: MapperContext,
  typeHint: TypeHintType | TypeHintType[],
): Promise<U[]> {
  if (Array.isArray(typeHint) && typeHint.length === 1) {
    // take single typehint as a template for all array items
    return _arrayToMappedType(array, context, typeHint[0] as TypeHintType);
  } else if (!Array.isArray(typeHint)) {
    const mapper = context.mappers.findMapper(typeHint);
    if (!mapper) {
      return array as any[] as U[];
    } else {
      const res: any[] = [];
      for (const u of array) {
        res.push(await mapper.map(u, context));
      }
      return res as U[];
    }
  } else if (typeHint.length === array.length) {
    const res: any[] = [];
    for (const i in typeHint) {
      const t = typeHint[i]!;
      const mapper = context.mappers.findMapper(t);
      if (!mapper) {
        res.push(array[i]);
      } else {
        res.push(await mapper.map(array[i], context));
      }
    }
    return res;
  } else {
    throw new TypeError(
      `Mapper expected a tuple (${typeHint.map((t) =>
        t instanceof Function ? t.name : t,
      )}), but got Array.length = ${array.length}`,
    );
  }
}
