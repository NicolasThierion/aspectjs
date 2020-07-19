import { AnnotationFactory } from '../annotation/factory/factory';
import { on } from './pointcut';

describe('PointcutExpression', () => {
    const AProperty = new AnnotationFactory('test').create(function AProperty(): PropertyDecorator {
        return;
    });

    describe('for a property getter', function () {
        it('should toString the property name', () => {
            expect(on.property.toString()).toEqual('property#get *');
        });

        it('should toString the annotation name', () => {
            expect(on.property.withAnnotations(AProperty).toString()).toEqual('property#get @test:AProperty *');
        });

        xit('should toString the parent class name', () => {
            expect(
                on.property
                    .withAnnotations(AProperty)
                    // .declaringClass()
                    // .name('*Service')
                    // .module('*')
                    .toString(),
            ).toEqual('class#*:*Service property#get *@test:AProperty');
        });
    });
});
