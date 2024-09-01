export interface PathVariablesHandler {
  /**
   * Matches and replaces path variables in a given URL with their corresponding values.
   * @param url the URL to replace path variables in.
   * @param pathVariables the variables to replace in the URL.
   * @returns the updated URL with replaced path variables.
   */
  replace(url: string, pathVariables: Record<string, any>): string;
}

export class DefaultPathVariablesHandler implements PathVariablesHandler {
  constructor(private readonly pattern = /:(\w+)/gm) {}

  replace(url: string, pathVariables: Record<string, any>): string {
    pathVariables = {
      ...pathVariables,
    };
    let newUrl = url;
    [...url.matchAll(this.pattern)].forEach(([match, variableName]) => {
      const _match = match!;
      const _variableName = variableName!;
      if (!pathVariables.hasOwnProperty(_variableName)) {
        throw new MissingPathVariableError(url, _match);
      }
      let variable = pathVariables[_variableName];
      variable = typeof variable === 'undefined' ? '' : `${variable}`;
      newUrl = newUrl.replace(_match, variable);
      delete pathVariables[_variableName];
    });

    const remainingVariables = Object.keys(pathVariables);
    if (remainingVariables.length > 0) {
      throw new PathVariableNotMatchedError(url, `:${remainingVariables[0]!}`);
    }
    return newUrl;
  }
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
