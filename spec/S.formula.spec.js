
describe("S.formula", function () {
    describe("creation", function () {
        var f;

        beforeEach(function () {
            f = S.formula(function () { return 1; });
        });

        it("throws if no function passed in", function () {
            expect(function() { S.formula(); }).toThrow();
        });

        it("throws if arg is not a function", function () {
            expect(function() { S.formula(1); }).toThrow();
        });

        it("generates a function", function () {
            expect(f).toEqual(jasmine.any(Function));
        });

        it("returns initial value of wrapped function", function () {
            expect(f()).toBe(1);
        });
    });

    describe("evaluation", function () {
        var spy, f;

        beforeEach(function () {
            spy = jasmine.createSpy("callCounter"),
            f = S(spy);
        });

        it("occurs once intitially", function () {
            expect(spy.calls.count()).toBe(1);
        });

        it("does not re-occur when read", function () {
            f(); f(); f();

            expect(spy.calls.count()).toBe(1);
        });
    });

    describe("with a dependency on an S.data", function () {
        var spy, d, f;

        beforeEach(function () {
            d = S(1),
            spy = jasmine.createSpy("callCounter"),
            f = S.formula(function () { spy(); return d(); });
        });

        it("updates when S.data is set", function () {
            d(1);
            expect(spy.calls.count()).toBe(2);
        });

        it("does not update when S.data is read", function () {
            d();
            expect(spy.calls.count()).toBe(1);
        });

        it("updates return value", function () {
            d(2);
            expect(f()).toBe(2);
        });
    });

    describe("with changing dependencies", function () {
        var i, t, e, spy, f;

        beforeEach(function () {
            i = S(true), t = S(1), e = S(2)
            spy = jasmine.createSpy("spy");
            f = S.formula(function () { spy(); return i() ? t() : e(); });
            spy.calls.reset();
        });

        it("updates on active dependencies", function () {
            t(5);
            expect(spy.calls.count()).toBe(1);
            expect(f()).toBe(5);
        });

        it("does not update on inactive dependencies", function () {
            e(5);
            expect(spy.calls.count()).toBe(0);
            expect(f()).toBe(1);
        });

        it("deactivates removed dependencies", function () {
            i(false);
            spy.calls.reset();
            t(5);
            expect(spy.calls.count()).toBe(0);
        });

        it("activates added dependencies", function () {
            i(false);
            spy.calls.reset();
            e(5);
            expect(spy.calls.count()).toBe(1);
        });
    });

    describe("that creates an S.data", function () {
        var d, f, spy;

        beforeEach(function () {
            spy = jasmine.createSpy("spy");
            f = S(function () { spy(); d = S(1); })
        });

        it("does not register a dependency", function () {
            spy.calls.reset();
            d(2);
            expect(spy.calls.count()).toBe(0);
        });
    });

    describe("that creates an S.formula", function () {
        var d, f, g, spy;

        beforeEach(function () {
            d = S(1);
            spy = jasmine.createSpy("spy");
            gspy = jasmine.createSpy("gspy");
            f = S(function () { spy(); g = S.formula(function () { gspy(); return d(); }); })
        });

        it("does not register a dependency", function () {
            spy.calls.reset();
            gspy.calls.reset();
            d(2);
            expect(gspy.calls.count()).toBe(1);
            expect(spy.calls.count()).toBe(0);
        });
    });

    describe("from a function with no return value", function () {
        var f;

        beforeEach(function () {
            f = S.formula(function () { });
        });

        it("reads as undefined", function () {
            expect(f()).not.toBeDefined();
        });
    });

    describe("from a function with intermittent return value", function () {
        var d, fn, f;

        beforeEach(function () {
            d = S.data(1);
            fn = function () { if(d()) return d(); },
            f = S.formula(fn);
        });

        it("does not change value when function returns no value", function () {
            d(0);
            expect(fn()).not.toBeDefined();
            expect(f()).toBe(1);
        });

        it("does change value when function returns a value", function () {
            d(2);
            expect(fn()).toBe(2);
            expect(f()).toBe(2);
        });
    });

    describe("propagation", function () {
        var d, evalCounter, f, watcherCounter, watcher;

        beforeEach(function () {
            d = S(1),
            evalCounter = jasmine.createSpy("evalCounter"),
            f = S.formula(function () { evalCounter(); return d(); }),
            watcherCounter = jasmine.createSpy("watcherEvalCounter"),
            watcher = S.formula(function () { watcherCounter(); return f(); });
        });

        it("does not cause re-evaluation", function () {
            expect(evalCounter.calls.count()).toBe(1);
        });

        it("does not occur from a read", function () {
            f();
            expect(watcherCounter.calls.count()).toBe(1);
        });

        it("does not occur from a read of the watcher", function () {
            watcher();
            expect(watcherCounter.calls.count()).toBe(1);
        });

        it("occurs when formula updates", function () {
            d(1);
            expect(evalCounter.calls.count()).toBe(2);
            expect(watcherCounter.calls.count()).toBe(2);
            expect(watcher()).toBe(1);
        });
    });

    describe("propagation with a valueless function", function () {
        var d, evalCounter, f, watcherCounter, watcher;

        beforeEach(function () {
            d = S(1),
            evalCounter = jasmine.createSpy("evalCounter"),
            f = S.formula(function () { evalCounter(); d(); }),
            watcherCounter = jasmine.createSpy("watcherCounter"),
            watcher = S.formula(function () { watcherCounter(); f(); });
        });

        it("does not occur", function () {
            d(true);
            expect(evalCounter.calls.count()).toBe(2);
            expect(watcherCounter.calls.count()).toBe(1);
        });
    });

    describe("propagation with intermitently valued function", function () {
        var d, evalCounter, f, watcherCounter, watcher;

        beforeEach(function () {
            d = S(1),
            evalCounter = jasmine.createSpy("evalCounter"),
            f = S.formula(function () { evalCounter(); if (d()) return d(); }),
            watcherCounter = jasmine.createSpy("watcherCounter"),
            watcher = S.formula(function () { watcherCounter(); f(); });
        });

        it("does not occur when function returns no value", function () {
            d(0);
            expect(evalCounter.calls.count()).toBe(2);
            expect(watcherCounter.calls.count()).toBe(1);
        });

        it("does occur when function returns a value", function () {
            d(2);
            expect(evalCounter.calls.count()).toBe(2);
            expect(watcherCounter.calls.count()).toBe(2);
        });
    });

    describe("with circular dependencies", function () {
        var spy, d, f;

        beforeEach(function () {
            //      d <-+
            //      |   |
            //      v   |
            //      f---+
            d = S(1),
            spy = jasmine.createSpy("callCounter"),
            f = S.formula(function () { spy(); return d(d() + 1); });
        });

        it("stops propagation at the point that it cycles", function () {
            expect(d()).toBe(2);
            expect(spy.calls.count()).toBe(1);
        });
    });

    describe("with complex circular dependencies", function () {
        var d, f1, f2, f3, f4, f5;

        beforeEach(function () {
            //      d <-----+---+---+---+---+
            //      |       |   |   |   |   |
            //      +-> f1 -+   |   |   |   |
            //      |           |   |   |   |
            //      +-> f2 -----+   |   |   |
            //      |               |   |   |
            //      +-> f3 ---------+   |   |
            //      |                   |   |
            //      +-> f3 -------------+   |
            //      |                       |
            //      +-> f3 -----------------+
            d = S(0);
            // when f1 updates d, it won't fire f1 but it will f2, 3, 4 and 5, etc.
            f1 = S.formula(function () { d(d() + 1); });
            f2 = S.formula(function () { d(d() + 1); });
            f3 = S.formula(function () { d(d() + 1); });
            f4 = S.formula(function () { d(d() + 1); });
            f5 = S.formula(function () { d(d() + 1); });
        });

        it("can produce factorial propagation", function () {
            d(0);
            // count(n) = n * (count(n - 1) + 1)
            expect(d()).toBe(325);
        });
    });

    describe("with diamond dependencies", function () {
        var d, f1, f2, f3, f4, f5;

        beforeEach(function () {
            //         d
            //         |
            // +---+---+---+---+
            // v   v   v   v   v
            // f1  f2  f3  f4  f5
            // |   |   |   |   |
            // +---+---+---+---+
            //         v
            //         g
            d = S(0);

            f1 = S.formula(function () { return d(); });
            f2 = S.formula(function () { return d(); });
            f3 = S.formula(function () { return d(); });
            f4 = S.formula(function () { return d(); });
            f5 = S.formula(function () { return d(); });

            spy = jasmine.createSpy("callCounter");
            g = S.formula(function () { spy(); return f1() + f2() + f3() + f4() + f5(); });
        });

        it("can produce linear propagation", function () {
            spy.calls.reset();
            d(0);
            expect(spy.calls.count()).toBe(5);
        });
    });

    describe("with interwoven diamond dependencies", function () {
        var d, f1, f2, f3, g1, g2, g3, h;

        beforeEach(function () {
            //    d
            //    |
            // +--+--+
            // v     v
            // f1    f2
            // | \ / |
            // |  X  |
            // | / \ |
            // v     v
            // g1    g2
            // +--+--+
            //    v
            //    h
            d = S(0);

            f1 = S.formula(function () { return d(); });
            f2 = S.formula(function () { return d(); });

            g1 = S.formula(function () { return f1() + f2(); });
            g2 = S.formula(function () { return f1() + f2(); });

            spy = jasmine.createSpy("callCounter");
            h  = S.formula(function () { spy(); return g1() + g2(); });
        });

        it("can produce exponential propagation", function () {
            spy.calls.reset();
            d(0);
            // two layers of 2 nodes each = 2 x 2 = 4
            expect(spy.calls.count()).toBe(4);
        });
    });

    describe("detach", function () {
        var d, f, spy;

        beforeEach(function () {
            d = S(1);
            spy = jasmine.createSpy("spy");
            f = S.formula(function () { spy(); d(); });
        });

        it("disables updates", function () {
            spy.calls.reset();
            d(2);
            expect(spy.calls.count()).toBe(1);
            f.S.detach();
            spy.calls.reset();
            d(3);
            expect(spy.calls.count()).toBe(0);
        });
    });
});
