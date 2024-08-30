if (typeof URL.canParse !== 'function') {
  URL.canParse = function (url: string) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
}
