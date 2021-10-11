import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { injectCookies } from './auth';

export async function initBrowser(
  configs: Array<string>,
): Promise<Browser | undefined> {
  puppeteer.use(StealthPlugin());

  let browser;
  await puppeteer
    .launch({
      // headless: false,
      args: [...configs],
    })
    .then(event => {
      browser = event;
    });

  return browser;
}

export async function getPage(browser: Browser): Promise<Page> {
  const pages = await browser.pages();

  if (pages.length) {
    return pages[0];
  }

  return browser.newPage();
}

export async function initInstagram(
  browser: Browser,
  username: string,
): Promise<false | Page> {
  const page = await getPage(browser);

  if (!page) {
    browser.close();
    return false;
  }

  try {
    await page.goto('https://www.instagram.com/', {
      waitUntil: 'domcontentloaded',
    });

    // Try auth
    await injectCookies(page, username);

    return page;
  } catch (err) {
    await page.screenshot({
      path: `temp/erro-page-${new Date().getTime()}.png`,
    });

    console.log('Erro page: ', err);
    return false;
  }
}
