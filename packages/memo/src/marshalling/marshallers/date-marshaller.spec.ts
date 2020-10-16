import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';

describe('Given a @Memo method that returns a Date', () => {
    let joinpoint: () => Date;

    beforeEach(() => {
        setupMemoAspect();
        joinpoint = jasmine.createSpy('process').and.callFake(() => new Date());
        localStorage.clear();
    });

    it('should return a Date', () => {
        const m = createMemoMethod(joinpoint);
        const res1 = m();
        const res2 = m();
        expect(joinpoint).toHaveBeenCalledTimes(1);
        expect(res2).toEqual(jasmine.any(Date));
        expect(res1).toEqual(res2);
    });
});
