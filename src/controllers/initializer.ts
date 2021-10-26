import { initBrowser, initInstagram } from './browser';

import { logger } from '../utils/logger';
import { puppeteerConfig } from '../config/puppeteer.config';

interface PageProps {
  username: string;
  proxy_port?: number;
}

export async function create({ username, proxy_port }: PageProps) {
  const browserConfigs = [...puppeteerConfig];

  // Config proxy
  if (proxy_port) {
    browserConfigs.push(`--proxy-server=http://localhost:${proxy_port}`);
  }

  const browser = await initBrowser(browserConfigs);
  if (!browser) {
    throw new Error(`Error open browser.`);
  }

  const page = await initInstagram(browser, username);
  if (!page) {
    await browser.close();
    throw new Error(`Error accessing page.`);
  }

  logger.info('Page successfully accessed.');
  return { browser, page };
}
