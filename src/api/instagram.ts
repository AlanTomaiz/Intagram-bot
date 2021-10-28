import { InstagramProps, ResponseLogin } from '../config/types';
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
        const user = await this.getUserData();
        const { id, fbid, profile_pic_url_hd, username } = user;

        return {
          status: `success`,
          message: `User connected with success!!!`,
          data: { id, fbid, profile_pic_url_hd, username },
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
    this.browser.close();
  }
}
