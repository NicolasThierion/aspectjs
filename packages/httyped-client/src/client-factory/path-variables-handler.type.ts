/**
 * Matches and replaces path variables in a given URL with their corresponding values.
 * @param url the URL to replace path variables in.
 * @param pathVariables the variables to replace in the URL.
 * @returns the updated URL with replaced path variables.
 */

export type PathVariablesHandler = (
  url: string,
  pathVariables: Record<string, any>,
) => string;

export class DefaultPathVariablesHandler {
  constructor(private readonly pattern = /:(\w+)/gm) {}

  replace = (path: string, pathVariables: Record<string, any>): string => {
    pathVariables = {
      ...pathVariables,
    };
    let newPath = path;
    [...path.matchAll(this.pattern)].forEach(([match, variableName]) => {
      const _match = match!;
      const _variableName = variableName!;
      if (!Object.prototype.hasOwnProperty.call(pathVariables, _variableName)) {
        throw new MissingPathVariableError(path, _match);
      }
      let variable = pathVariables[_variableName];
      variable = typeof variable === 'undefined' ? '' : `${variable}`;
      newPath = newPath.replace(_match, variable);
      delete pathVariables[_variableName];
    });

    const remainingVariables = Object.keys(pathVariables);
    if (remainingVariables.length > 0) {
      throw new PathVariableNotMatchedError(path, `:${remainingVariables[0]!}`);
    }
    return newPath;
  };
}

export class PathVariableMatchError extends Error {
  constructor(
    public readonly string: string,
    public readonly variable: string,
    message: string,
  ) {
    super(message);
  }
}

export class MissingPathVariableError extends PathVariableMatchError {
  constructor(string: string, variable: string) {
    super(
      string,
      variable,
      `Missing path variable ${variable} in string ${string}`,
    );
  }
}

export class PathVariableNotMatchedError extends PathVariableMatchError {
  constructor(string: string, variable: string) {
    super(
      string,
      variable,
      `No path variable matched ${variable} in string ${string}`,
    );
  }
}
