import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { puppeteerConfig } from '../config/puppeteer.config';
import { injectCookies } from './auth';

export async function initBrowser(): Promise<Browser | undefined> {
  puppeteer.use(StealthPlugin());

  let browser;
  await puppeteer
    .launch({
      headless: false,
      args: puppeteerConfig,
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
    console.log('Erro page: ', err);
    return false;
  }
}
