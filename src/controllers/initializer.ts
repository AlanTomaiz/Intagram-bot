import { initBrowser, initInstagram } from './browser';
import AppError from '../errors/app-error';
import Instagram from '../api/instagram';

import { logger } from '../utils/logger';
import { Credentials } from '../config/types';
import { puppeteerConfig } from '../config/puppeteer.config';

interface Response {
  success: boolean;
  status?: string;
  data?: any;
}

export async function create(
  credentials: Credentials,
  proxy_port?: number,
): Promise<Response> {
  const browserConfigs = [...puppeteerConfig];

  // Config proxy
  if (proxy_port) {
    browserConfigs.push(`--proxy-server=http://localhost:${proxy_port}`);
  }

  logger.info(`Initializing browser...`);
  const browser = await initBrowser(browserConfigs);

  if (!browser) {
    throw new AppError(`Error open browser.`);
  }

  logger.info(`Accessing page...`);
  const page = await initInstagram(browser, credentials.username);

  if (!page) {
    throw new AppError(`Error accessing page.`);
  }

  logger.info('Page successfully accessed.');
  const instagram = new Instagram(page, credentials);

  return instagram
    ._initialize()
    .then(async () => {
      const user = await instagram.getUserData();
      browser.close();

      const { id, fbid, profile_pic_url_hd, username } = user;

      return {
        success: true,
        data: { id, fbid, profile_pic_url_hd, username },
      };
    })
    .catch(async error => {
      browser.close();
      const { data } = error;

      if (data) {
        throw new AppError(data);
      }

      // TIMEOU
      console.error('error', error.message);
      await page.screenshot({
        path: `temp/page-${new Date().getTime()}.png`,
      });

      return {
        success: false,
        status: 'TIMEOU',
      };
    })
    .catch(error => {
      return {
        success: false,
        data: error.data,
      };
    });
}
