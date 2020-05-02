xdescribe('MemoAspect', () => {
    xdescribe('given an advice', () => {
        xdescribe('that do not specify driver type', () => {
            xdescribe('when the advice returns a promise', () => {
                xit('should select the "IndexedDb" Driver', () => {});
            });
            xdescribe('when the advice does not return a promise', () => {
                xit('should select the "LocalStorage" Driver', () => {});
            });
        });
        xdescribe('that specifies driver type', () => {
            describe('as a string', () => {
                it('should select that driver');

                xdescribe('but there is no driver for this type', () => {
                    it('should throw an error');
                });
                xdescribe('but the specified driver do not accept the return value', () => {
                    it('should throw an error');
                });
            });

            describe('as a Class', () => {
                it('should select that driver');

                xdescribe('but there is no driver for this class', () => {
                    it('should throw an error');
                });

                xdescribe('but the specified driver do not accept the return value', () => {
                    it('should throw an error');
                });
            });
        });
    });
});
