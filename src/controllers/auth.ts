/* eslint no-empty: "off" */
import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import Request from 'request';

import { logger } from '../utils/logger';
import { slugfy } from '../utils/slugfy';

interface Request {
  page: Page;
  user: string;
  pass: string;
}

const directory = path.resolve(__dirname, '..', '..', 'cookies');

export function tryDeleteCookies(username: string) {
  try {
    const parsedName = slugfy(username);
    const cookiesPath = `${directory}/${parsedName}.data.json`;

    fs.unlinkSync(cookiesPath);
  } catch (err) {
    // console.log('error cookies', err);
    logger.error('No cookies to delete');
  }
}

export async function trySaveCookies(page: Page, username: string) {
  try {
    logger.info('Saving cookies');

    const cookies = await page.cookies();
    const parsedName = slugfy(username);
    const cookiesPath = `${directory}/${parsedName}.data.json`;

    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
  } catch (err) {
    // console.log('error cookies', err);
    logger.error(`Failed to save cookie.`);
  }
}

export async function tryLoadCookies(page: Page, username: string) {
  try {
    const parsedName = slugfy(username);
    const cookiesPath = `${directory}/${parsedName}.data.json`;

    const readSync = fs.readFileSync(cookiesPath);
    const cookies = JSON.parse(readSync.toString());

    const promisses = [];
    for (const cookie of cookies) {
      if (cookie.name !== 'ig_lang') {
        promisses.push(page.setCookie(cookie));
      }
    }

    await Promise.all(promisses);
  } catch (err) {
    // console.log('error cookies', err);
    logger.error('No cookies found');
  }
}
