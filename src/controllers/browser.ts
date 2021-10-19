/* eslint no-empty: "off" */
import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { injectCookies } from './auth';

export async function initBrowser(
  configs: string[],
): Promise<Browser | undefined> {
  puppeteer.use(StealthPlugin());

  return puppeteer.launch({
    // headless: false,
    args: [...configs],
  });
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
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    await page.setCookie({
      name: 'ig_lang',
      value: 'en',
      path: '/',
    });

    // Try auth
    await injectCookies(page, username);

    return page;
  } catch {}

  try {
    await page.goto('https://www.instagram.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    await page.setCookie({
      name: 'ig_lang',
      value: 'en',
      path: '/',
    });

    // Try auth
    await injectCookies(page, username);

    return page;
  } catch (err: any) {
    await page.screenshot({
      path: `temp/erro-page-${new Date().getTime()}.png`,
    });

    // browser.close();
    // return false;
  }

  try {
    await page.goto('http://ip6only.me/', {
      waitUntil: 'domcontentloaded',
    });

    await page.screenshot({
      path: `temp/ipv6-${new Date().getTime()}.png`,
    });

    console.log('Teste IPV6.');
    browser.close();
    return false;
  } catch {
    console.log('Erro IPV6.');
    browser.close();
    return false;
  }
}
