/* eslint no-restricted-globals: "off" */
import { InstagramProps, ResponseLogin } from '../config/types';
import { userInterface } from '../controllers/auth';
import { logger } from '../utils/logger';
import AppError from '../errors/app-error';
import Profile from './profile';
import Sleep from '../utils/sleep';

export default class Instagram extends Profile {
  browser;

  constructor({ browser, page, credentials, relogin }: InstagramProps) {
    super(page, credentials, relogin);
    this.browser = browser;
  }

  async startLogin(): Promise<ResponseLogin> {
    return this._initialize()
      .then(async () => {
        return {
          status: `success`,
          message: `User connected with success!!!`,
        };
      })
      .catch(async error => {
        const { data } = error;
        await this.close();

        // TIMEOU
        if (!(error instanceof AppError)) {
          throw new Error(error.message);
        }

        throw new AppError(data);
      });
  }

  async close() {
    logger.info('Close browser.');
    this.browser.close();
  }

  async follow(username: string) {
    try {
      await this.page.goto(`https://www.instagram.com/${username}`, {
        waitUntil: 'domcontentloaded',
      });

      await this.page.waitForSelector('input[placeholder="Search"]', {
        visible: true,
        timeout: 10000,
      });

      const messageButton = (await this.page.$x('//div[text()="Message"]'))[0];
      if (messageButton) {
        throw new Error('follower');
      }

      const followButton = (await this.page.$x('//button[text()="Follow"]'))[0];
      if (!followButton) {
        throw new Error();
      }

      await followButton.click();
      await Sleep(1000);

      const blockButton = (
        await this.page.$x('//button[text()="Report a Problem"]')
      )[0];

      if (blockButton) {
        throw new Error('block');
      }

      await this.close();
      return true;
    } catch ({ message }) {
      await this.page.screenshot({
        path: `temp/page-erro-follow-${new Date().getTime()}.png`,
      });

      if (message === 'follower') {
        await this.close();
        throw new AppError('FOLLOWER');
      }

      if (message === 'block') {
        await this.close();
        throw new AppError('block');
      }

      await Sleep(1000);
      const status = await userInterface(this.page);

      await this.close();
      throw new AppError(String(status));
    }
  }
}
