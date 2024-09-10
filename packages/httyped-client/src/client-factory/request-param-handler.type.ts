export type RequestParamsHandler = (
  requestParams: [string, unknown][],
) => string;

export class DefaultRequestParamHandler {
  stringify = (requestParams: [string, unknown][]): string => {
    return requestParams.length
      ? `?` +
          requestParams
            .map(([name, value]) => {
              return Array.isArray(value)
                ? value.map((v) => `${name}=${v}`).join('&')
                : `${name}=${value}`;
            })
            .join('&')
      : '';
  };
}
