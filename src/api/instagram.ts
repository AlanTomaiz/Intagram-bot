import { InstagramProps, ResponseLogin } from '../config/types';
import { logger } from '../utils/logger';
import AppError from '../errors/app-error';
import Profile from './profile';

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
}
