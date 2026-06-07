/// <reference types="@onting/selenium-webdriver-message-port-types/selenium-webdriver.js" />

import { Browser, Builder, logging } from 'selenium-webdriver';
import getScriptManagerInstance from 'selenium-webdriver/bidi/scriptManager.js';
import { Options } from 'selenium-webdriver/chrome.js';

export default async function buildAndNavigate(relativeURL: string) {
  const loggingPrefs = new logging.Preferences();

  loggingPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  const options = new Options();

  options.enableBidi();
  options.setLoggingPrefs(loggingPrefs);

  const webDriver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .usingServer('http://localhost:4444/wd/hub/')
    .build();

  await webDriver.navigate().to(new URL(relativeURL, 'http://web/').href);

  const browsingContextId = await webDriver.getWindowHandle();
  const scriptManager = await getScriptManagerInstance(browsingContextId, webDriver);

  const [realmInfo] = await scriptManager.getRealmsByType('window');

  if (!realmInfo) {
    throw new Error(`Internal error: no window found after navigated to ${relativeURL}`);
  }

  const teardown = async () => {
    try {
      await scriptManager.close();
    } finally {
      await webDriver.quit();
    }
  };

  return {
    realmInfo,
    scriptManager,
    teardown,
    webDriver
  };
}
