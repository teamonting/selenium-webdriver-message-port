import { logging, type WebDriver } from 'selenium-webdriver';

export default async function flushBrowserLogs(webDriver: WebDriver): Promise<readonly logging.Entry[]> {
  return Object.freeze(await webDriver.manage().logs().get(logging.Type.BROWSER));
}
