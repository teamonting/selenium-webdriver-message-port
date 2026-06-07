declare module 'selenium-webdriver/chrome.js' {
  class Options {
    enableBidi(): this;
    setLoggingPrefs(prefs: unknown): this;
  }
}
