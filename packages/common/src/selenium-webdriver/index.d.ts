declare module 'selenium-webdriver' {
  namespace logging {
    class Level {
      static ALL: Level;
      static DEBUG: Level;
      static FINE: Level;
      static FINER: Level;
      static FINEST: Level;
      static INFO: Level;
      static OFF: Level;
      static SEVERE: Level;
      static WARNING: Level;
      name: string;
      value: number;
    }

    const Type: {
      BROWSER: 'browser';
      CLIENT: 'client';
      DRIVER: 'driver';
      PERFORMANCE: 'performance';
      SERVER: 'server';
    };

    class Entry {
      level: Level;
      message: string;
      timestamp: number;
      type: string;
    }

    class Preferences {
      setLevel(type: string, level: Level | string | number): void;
    }
  }

  const Browser: {
    CHROME: string;
    [key: string]: string;
  };

  interface BrowsingContextInstance {
    close(): Promise<void>;
    id?: string;
    navigate(url: string): Promise<void>;
  }

  function BrowsingContext(
    driver: WebDriver,
    options: { browsingContextId?: string; createParameters?: unknown; type?: string }
  ): Promise<BrowsingContextInstance>;

  class WebDriver {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeScript<T = any>(script: string | ((...args: any[]) => T), ...args: any[]): Promise<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeAsyncScript<T = any>(script: string | ((...args: any[]) => void), ...args: any[]): Promise<T>;

    getWindowHandle(): Promise<string>;
    manage(): { logs(): { get(type: string): Promise<readonly logging.Entry[]> } };
    navigate(): { to(url: string): Promise<void> };
    quit(): Promise<void>;
  }

  class Builder {
    build(): Promise<WebDriver>;
    forBrowser(browser: string): this;
    setChromeOptions(options: unknown): this;
    usingServer(url: string): this;
  }
}
