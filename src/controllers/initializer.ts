import Instagram from '../api/instagram';
import AppError from '../errors/app-error';
import { initBrowser, initInstagram } from './browser';
import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { puppeteerConfig } from '../config/puppeteer.config';

export async function create(credentials: Credentials, proxy_port?: number) {
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
  const client = new Instagram(page, credentials);

  try {
    const response = await client._initialize();

    if (response.success) {
      logger.info(`User connected with success!!!`);

      const user = await client.getUserData();
      browser.close();

      return {
        ...response,
        ...user,
      };
    }

    browser.close();
    return response;
  } catch (err: any) {
    browser.close();
    throw new AppError(err.data || err.message || err);
  }
}
