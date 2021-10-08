import phpRunner from 'child_process';
import promisify from 'promisify-node';

import AppError from '../errors/app-error';
import { initBrowser, getPage } from './browser';
import { logger } from '../utils/logger';
import { puppeteerConfig } from '../config/puppeteer.config';

export async function TestConnection() {
  // Proxy
  const execPHP = promisify(phpRunner.exec);
  const ipProxy = await execPHP('php script.php addIpv6,1');
  const proxy = JSON.parse(ipProxy)[0];

  const browserConfigs = [
    ...puppeteerConfig,
    `--proxy-server=http://localhost:${proxy.port}`,
  ];

  const browser = await initBrowser(browserConfigs);
  logger.info(`Initializing browser...`);

  if (!browser) {
    logger.error(`Error no open browser.`);
    throw new AppError('Erro ao inicializar browser, tente novamente.');
  }

  try {
    const page = await getPage(browser);

    await page.goto('http://ip6only.me/', {
      waitUntil: 'domcontentloaded',
    });

    await execPHP(`php script.php rmIpv6,${proxy.ip}`);
    await execPHP('php script.php restartSquid');
    await browser.close();
  } catch {
    throw new AppError('Falha na conexão com prox!');
  }
}
