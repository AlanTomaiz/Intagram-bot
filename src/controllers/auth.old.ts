/* eslint no-empty: "off" */
import { Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { logger } from '../utils/logger';
import { slugfy } from '../utils/slugfy';

const directory = path.resolve(__dirname, '..', '..', 'cookies');

export async function userInterface(page: Page) {
  return page
    .waitForFunction(() => {
      const button = document.querySelector('main section button');
      if (button && button.innerHTML === 'Save Info') {
        return 'CONFIRM_CONNECTED';
      }

      const pageWrapper = document.querySelector('input[placeholder="Search"]');
      // const userData = window._sharedData.config.viewer;
      if (pageWrapper) {
        return 'CONNECTED';
      }

      // CHECKPOINT
      const pageHTML = document.querySelector('section div h3, section div h2');
      if (
        pageHTML &&
        (pageHTML.innerHTML === 'We Detected An Unusual Login Attempt' ||
          pageHTML.innerHTML === 'Your Account Was Compromised')
      ) {
        return 'CHECKPOINT';
      }

      const recaptcha = document.querySelector('#recaptcha-input');
      const phoneInput = document.querySelector('input[autocomplete="tel"]');
      if (recaptcha || phoneInput) {
        return 'CHECKPOINT';
      }

      const loginForm = document.querySelector('input[name="username"]');
      if (loginForm) {
        return 'DISCONNECTED';
      }

      return 'NEW_TEST_INTERFACE';
    })
    .then(async event => {
      return event.evaluate(status => status);
    })
    .catch(async () => {
      // await page.screenshot({
      //   path: `temp/page-NEW-TEST-INTERFACE-CATCH-${new Date().getTime()}.png`,
      // });

      return 'NEW_TEST_INTERFACE_CATCH';
    });
}

export async function getInterfaceStatus(page: Page) {
  try {
    await page.waitForSelector('input[name="username"]', {
      visible: true,
      timeout: 10000,
    });

    return 'DISCONNECTED';
  } catch {}

  return userInterface(page);
}

export async function saveCookies(page: Page, username: string) {
  const cookies = await page.cookies();
  const parsedName = slugfy(username);

  try {
    fs.writeFileSync(
      `${directory}/${parsedName}.data.json`,
      JSON.stringify(cookies),
    );
  } catch {
    logger.error(`Failed to save cookie.`);
  }

  return cookies;
}

export async function injectCookies(page: Page, username: string) {
  let cookies;

  const parsedName = slugfy(username);
  const filePath = `${directory}/${parsedName}.data.json`;

  if (fs.existsSync(filePath)) {
    const readSync = fs.readFileSync(filePath).toString();
    cookies = JSON.parse(readSync);
  }

  // Auth with cookie
  if (cookies) {
    await page.setCookie(...cookies);
  }
}
