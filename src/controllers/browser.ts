/* eslint no-empty: "off", no-await-in-loop: "off" */
import puppeteer, { Browser } from 'puppeteer';

import { tryLoadCookies } from './auth';

export async function initBrowser(configs: string[]) {
  return puppeteer.launch({
    headless: false,
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
    throw new Error(`Error accessing page.`);
  }

  const collectData = async () => {
    try {
      await page.goto('https://www.instagram.com/', {
        waitUntil: 'domcontentloaded',
      });

      await page.setCookie({ name: 'ig_lang', value: 'en', path: '/' });
      await tryLoadCookies(page, username);

      await page.evaluate(() => {
        window.location.reload();
      });

      await page.waitForNavigation({
        waitUntil: 'domcontentloaded',
      });

      // Page logger
      // page.on('console', msg => console.log('PAGE LOG:', msg.text()));

      return true;
    } catch (err) {
      // console.log('error access page: ', err.message);

      return false;
    }
  };

  // Retry request until it gets data or tries 5 times
  while (data === false && attempts < 5) {
    data = await collectData();
    attempts += 1;

    if (!data) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  if (data) {
    return;
  }

  // await page.screenshot({
  //   path: `temp/page-erro-${new Date().getTime()}.png`,
  // });

  browser.close();
  throw new Error(`Error accessing page.`);
}
