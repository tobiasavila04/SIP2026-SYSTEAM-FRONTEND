import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

export async function createDriver() {
  const options = new chrome.Options();
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--no-sandbox', '--disable-dev-shm-usage');
  options.addArguments('--window-size=1280,720');
  options.addArguments('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  return await new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

export async function findByTestId(driver, testId, timeout = 5000) {
  return await driver.wait(until.elementLocated(By.css(`[data-testid="${testId}"]`)), timeout);
}

export async function findEl(driver, css, timeout = 5000) {
  return await driver.wait(until.elementLocated(By.css(css)), timeout);
}

export async function typeIn(driver, css, text, timeout = 5000) {
  const el = await findEl(driver, css, timeout);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

export async function clickEl(driver, css, timeout = 5000) {
  const el = await findEl(driver, css, timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  await el.click();
  return el;
}

export async function getText(driver, css, timeout = 5000) {
  const el = await findEl(driver, css, timeout);
  return await el.getText();
}

export { BASE_URL, By, assert };
