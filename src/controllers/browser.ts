/* eslint no-empty: "off", no-await-in-loop: "off" */
import puppeteer, { Browser } from 'puppeteer';

import { injectCookies } from './auth';

export async function initBrowser(configs: string[]) {
  return puppeteer.launch({
    // headless: false,
    args: [...configs],
  });
}

export async function getPage(browser: Browser) {
  const pages = await browser.pages();

  if (pages.length) {
    return pages[0];
  }

  return browser.newPage();
}

export async function initInstagram(browser: Browser, username: string) {
  let data = false;
  let attempts = 0;
  const page = await getPage(browser);

  if (!page) {
    browser.close();
    return false;
  }

  const collectData = async () => {
    try {
      await page.goto('https://www.instagram.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      // Set lang page
      await page.setCookie({ name: 'ig_lang', value: 'en', path: '/' });

      // Try auth
      await injectCookies(page, username);

      await page.evaluate(() => {
        window.location.reload();
      });

      await page.waitForNavigation({
        waitUntil: 'domcontentloaded',
      });

      return true;
    } catch (err: any) {
      // console.error(err.message);
      return false;
    }
  };

  // Retry request until it gets data or tries 5 times
  while (data === false && attempts < 5) {
    data = await collectData();
    attempts += 1;

    if (!data) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (data) {
    return page;
  }

  await page.screenshot({
    path: `temp/erro-page-${new Date().getTime()}.png`,
  });

  browser.close();
  return false;
}
