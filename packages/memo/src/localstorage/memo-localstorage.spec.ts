import { Memo } from '../memo';
import { createLocalStorage } from 'localstorage-ponyfill';
import { LsMemoAspect } from './memo-localstorage';
import { LoadTimeWeaver, setWeaver } from '@aspectjs/core';

interface Runner {
    process(...args: any[]): any;
}

let r: Runner;
describe('@Memo with LocalStorage aspect', () => {
    let process: Runner['process'];

    const defaultArgs = ['a', 'b', 'c', 'd'];

    beforeEach(() => {
        const ls = createLocalStorage();
        ls.clear();
        setWeaver(
            new LoadTimeWeaver().enable(
                new LsMemoAspect({
                    localStorage: ls,
                }),
            ),
        );

        class RunnerImpl implements Runner {
            @Memo()
            process(...args: any[]) {
                return process(...args);
            }
        }

        r = new RunnerImpl();
        process = jasmine
            .createSpy('process', function _process(...args: any[]) {
                return args.reverse();
            })
            .and.callThrough();
    });

    describe('when the method is called once', () => {
        it('should call the method', () => {
            const res = r.process(...defaultArgs);
            expect(process).toHaveBeenCalled();
            expect(res).toEqual(defaultArgs.reverse());
            expect(process).toHaveBeenCalledTimes(1);
        });
    });
    describe('when the method is called twice', () => {
        describe('with the same parameters', () => {
            it('should not invoke the method twice', () => {
                let res = r.process(...defaultArgs);
                expect(process).toHaveBeenCalled();
                res = r.process(...defaultArgs);
                expect(res).toEqual(defaultArgs.reverse());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });
    });
});
