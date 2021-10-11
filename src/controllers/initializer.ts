import Instagram from '../api/instagram';
import AppError from '../errors/app-error';
import { initBrowser, initInstagram } from './browser';
import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { puppeteerConfig } from '../config/puppeteer.config';

export async function create(credentials: Credentials, proxy_port: number) {
  const browserConfigs = [
    ...puppeteerConfig,
    `--proxy-server=http://localhost:${proxy_port}`,
  ];

  logger.info(`Initializing browser...`);
  const browser = await initBrowser(browserConfigs);

  if (!browser) {
    logger.error(`Error open browser.`);
    throw new AppError('Erro ao inicializar browser, tente novamente.');
  }

  const page = await initInstagram(browser, credentials.username);

  if (!page) {
    logger.error(`Error accessing page.`);
    throw new AppError('Erro ao acessar a página, tente novamente.');
  }

  const client = new Instagram(page, credentials);
  logger.info('Page successfully accessed.');

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

    return response;
  } catch (err: any) {
    logger.error(err.message);
    browser.close();

    return err;
  }
}
