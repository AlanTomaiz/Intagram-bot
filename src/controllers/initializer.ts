import Instagram from '../api/instagram';
import AppError from '../errors/app-error';
import { initBrowser, initInstagram } from './browser';
import { Credentials } from '../config/types';
import { logger } from '../utils/logger';

export async function create(credentials: Credentials) {
  const browser = await initBrowser();
  logger.info(`Initializing browser...`);

  if (!browser) {
    logger.error(`Error no open browser.`);
    throw new AppError('Erro ao inicializar browser, tente novamente.');
  }

  const page = await initInstagram(browser, credentials.username);

  if (!page) {
    logger.error(`Error no open browser.`);
    throw new AppError('Erro ao inicializar browser, tente novamente.');
  }

  const client = new Instagram(page, credentials);
  logger.info('Page successfully accessed.');

  try {
    const response = await client._initialize();

    if (response === 'success') {
      logger.info(`User connected with success!!!`);

      const user = await client.getUserData();
      browser.close();

      return user;
    }
  } catch (err: any) {
    logger.error(err.message);
    browser.close();

    return err;
  }

  return false;
}
