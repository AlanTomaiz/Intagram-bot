import { InstagramProps, ResponseLogin } from '../config/types';
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
    await this.page.goto(`https://www.instagram.com/${username}`, {
      waitUntil: 'domcontentloaded',
    });

    try {
      await Sleep(500);

      const followButton = (await this.page.$x('//button[text()="Follow"]'))[0];
      if (!followButton) {
        throw new Error();
      }

      await followButton.click();
      await Sleep(1000);
      await this.close();

      return true;
    } catch {
      await this.page.screenshot({
        path: `temp/page-erro-follow-${new Date().getTime()}.png`,
      });

      await this.close();

      throw new AppError(
        'Não foi possível realizar esta operação, tente novamente.',
      );
    }
  }
}
