import { Annotation } from '../..';

export abstract class PointcutExpression {
    protected _annotations: Annotation[] = [];

    annotations(...annotation: Annotation[]): PointcutExpression {
        this._annotations = annotation;
        return this;
    }
}

export class ClassPointcutExpression extends PointcutExpression {
    constructor(private _selector?: PointcutExpression) {
        super();
    }

    protected _name = '*';
    protected _module = '*';

    // TODO enable class name filtering
    // name(name: string): this {
    //     this._name = name ?? '*';
    //     return this;
    // }
    // TODO enable module id filtering
    // module(moduleName: string): this {
    //     this._module = moduleName ?? '*';
    //     return this;
    // }

    toString(): string {
        return `class#${this._module}:${this._name}${this._annotations.map(a => a.toString()).join(',')}${
            this._selector ? ` ${this._selector}` : ''
        }`;
    }
}

export class PropertyPointcutExpression extends PointcutExpression {
    protected _name = '*';

    constructor(private _access: 'set' | 'get') {
        super();
    }

    // name(name: string): this {
    //     this._name = name ?? '*';
    //     return this;
    // }

    // ofClass(): ClassPointcutExpression {
    //     return new ClassPointcutExpression(this);
    // }

    annotations(...annotations: Annotation[]): PropertyPointcutExpression {
        super.annotations(...annotations);
        return this;
    }

    toString(): string {
        return `property.${this._access}#${this._name}${this._annotations.map(a => a.toString()).join(',')}`;
    }
}

export class MethodPointcutExpression extends PointcutExpression {
    constructor(param?: ParameterPointcutExpression) {
        super();
    }

    protected _name = '*';

    // TODO enable by method name filtering
    // name(name: string): this {
    //     this._name = name ?? '*';
    //     return this;
    // }

    // ofClass(ctor: Function): ClassPointcutExpression {
    //     return new ClassPointcutExpression();
    // }

    toString(): string {
        throw new Error('not implemented');
    }
}

export class ParameterPointcutExpression extends PointcutExpression {
    // ofMethod(): MethodPointcutExpression {
    //     return new MethodPointcutExpression(this);
    // }

    toString(): string {
        throw new Error('not implemented');
    }
}

class PointcutExpressionFactory {
    get class() {
        return new ClassPointcutExpression();
    }

    get properties() {
        return {
            getter: new PropertyPointcutExpression('get'),
            setter: new PropertyPointcutExpression('set'),
        };
    }

    get methods() {
        return new MethodPointcutExpression();
    }
    get args() {
        return new ParameterPointcutExpression();
    }
}

export const pc = new PointcutExpressionFactory();
