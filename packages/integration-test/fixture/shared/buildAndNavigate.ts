import { Browser, Builder, logging } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';

export default async function buildAndNavigate(relativeURL: string) {
  const loggingPrefs = new logging.Preferences();

  loggingPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  const options = new Options();

  options.setLoggingPrefs(loggingPrefs);

  const webDriver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .usingServer('http://localhost:4444/wd/hub/')
    .build();

  await webDriver.navigate().to(new URL(relativeURL, 'http://web/').href);

  return webDriver;
}
