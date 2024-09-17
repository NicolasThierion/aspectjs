// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
(function (Object) {
  typeof globalThis !== 'object' &&
    (this
      ? get()
      : (Object.defineProperty(Object.prototype, '_T_', {
          configurable: true,
          get: get,
        }),
        _T_));
  function get() {
    const global = this || self;
    global.globalThis = global;
    delete Object.prototype._T_;
  }
})(Object);
