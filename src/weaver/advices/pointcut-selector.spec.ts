import { AnnotationFactory } from '../../annotation/factory/factory';
import { pc } from './pointcut';

describe('PointcutExpression', () => {
    const AProperty = new AnnotationFactory('test').create(function AProperty(): PropertyDecorator {
        return;
    });

    describe('for a property getter', function() {
        it('should toString the property name', () => {
            expect(pc.property.getter.toString()).toEqual('property.get#*');
        });

        it('should toString the annotation name', () => {
            expect(pc.property.getter.annotations(AProperty).toString()).toEqual('property.get#*@test:AProperty');
        });

        xit('should toString the parent class name', () => {
            expect(
                pc.property.getter
                    .annotations(AProperty)
                    // .declaringClass()
                    // .name('*Service')
                    // .module('*')
                    .toString(),
            ).toEqual('class#*:*Service property.get#*@test:AProperty');
        });
    });
});
