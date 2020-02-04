import { async } from '@angular/core/testing';
import { getWeaver } from '@aspectjs/core';

describe('AspectJS', () => {
    it('should define a "getWeaver() function', () => {
        debugger;
        expect(getWeaver).toBeDefined();
        expect(getWeaver).toEqual(jasmine.any(Function));
    });
    beforeEach(async(() => {}));
});
