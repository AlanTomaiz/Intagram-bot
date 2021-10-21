import { InstagramProps, ResponseLogin } from '../config/types';
import AppError from '../errors/app-error';
import Profile from './profile';

export default class Instagram extends Profile {
  browser;

  constructor({ browser, page, credentials }: InstagramProps) {
    super(page, credentials);

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

        // TIMEOU
        if (!(error instanceof AppError)) {
          throw new AppError(error.message);
        }

        return {
          status: `checkpoint`,
          message: data.message,
          type: data.status,
        };
      })
      .catch(async ({ data }) => {
        await this.page.screenshot({
          path: `temp/page-${new Date().getTime()}.png`,
        });

        return {
          status: `error`,
          message: data,
        };
      });
  }

  async close() {
    this.browser.close();
  }
}
