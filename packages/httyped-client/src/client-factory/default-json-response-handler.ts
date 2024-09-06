import {
  AbstractToken,
  ConstructorType,
  isAbstractToken,
} from '@aspectjs/common/utils';
import { AfterReturnContext, PointcutType } from '@aspectjs/core';
import { TypeHint } from '../annotations/type.annotation';
import { MapperError } from '../types/mapper.error';
import { MapperContext } from '../types/mapper.type';
import { ResponseHandler } from '../types/response-handler.type';
import { TypeHintType } from '../types/type-hint.type';

export const MAP_JSON_RESPONSE_HANDLER: ResponseHandler = async (
  response,
  config,
  ctxt,
) => {
  let body = await response.json();

  if (body) {
    let typeHint = await _findTypeHint(ctxt);

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
      return mapper ? mapper.map(body, context) : body;
    }
  }

  return body;
};
async function _findTypeHint(
  ctxt: AfterReturnContext<PointcutType.METHOD>,
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

      if (abstractTokenTemplate !== undefined) {
        return Array.isArray(abstractTokenTemplate)
          ? _arrayToTypeArray(abstractTokenTemplate)
          : Object.getPrototypeOf(abstractTokenTemplate).constructor;
      }
    },
  );
}

function _arrayToTypeArray<T = unknown>(array: T[]): ConstructorType<T>[] {
  return array.map((t) => {
    return Array.isArray(t)
      ? _arrayToTypeArray(t)
      : Object.getPrototypeOf(t).constructor;
  });
}

function _arrayToMappedType<T = unknown, U = unknown>(
  array: T[],
  context: MapperContext,
  typeHint: TypeHintType | TypeHintType[],
): U[] {
  if (Array.isArray(typeHint) && typeHint.length === 1) {
    // take single typehint as a template for all array items
    return _arrayToMappedType(
      array,
      context,
      (typeHint = typeHint[0] as TypeHintType),
    );
  } else if (!Array.isArray(typeHint)) {
    const mapper = context.mappers.findMapper(typeHint);
    const res = mapper ? array.map((u) => mapper.map(u, context)) : array;
    return res as U[];
  } else if (typeHint.length === array.length) {
    return typeHint.map((t, i) => {
      const mapper = context.mappers.findMapper(t);
      return (mapper ? mapper.map(array[i], context) : array[i]) as U;
    });
  } else {
    throw new TypeError(
      `Mapper expected a tuple (${typeHint.map((t) =>
        t instanceof Function ? t.name : t,
      )}), but got Array.length = ${array.length}`,
    );
  }
}
