import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';

describe('Given a @Memo method', () => {
    let joinpoint: jasmine.Spy;
    let memoMethod: () => any;

    beforeEach(() => {
        setupMemoAspect();
        localStorage.clear();
        joinpoint = jasmine.createSpy('process').and.callFake(() => {});
        memoMethod = createMemoMethod((...args: any[]) => joinpoint(args));
    });

    describe('that returns undefined', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('process').and.callFake(() => undefined);
        });
        it('should return undefined', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(undefined);
        });
    });

    describe('that returns a boolean', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('process').and.callFake(() => false);
        });
        it('should return the boolean,', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(false);
        });
    });

    describe('that returns a number', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('process').and.callFake(() => 0);
        });
        it('should return the number,', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(0);
        });
    });
});
