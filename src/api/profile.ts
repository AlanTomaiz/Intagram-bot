import { Page } from 'puppeteer';

import AppError from '../errors/app-error';
import { Credentials } from '../config/types';
import { getInterfaceStatus, saveCookies } from '../controllers/auth';

export default class Profile {
  readonly credentials: Credentials;

  constructor(public page: Page, credentials: Credentials) {
    this.credentials = credentials;
  }

  public async _initialize() {
    let status = await getInterfaceStatus(this.page);

    if (status === 'DISCONNECTED') {
      status = await this.waitForLogin();
    }

    if (status === 'CONNECTED') {
      await saveCookies(this.page, this.credentials.username);
      return 'success';
    }

    if (status === 'USER_NOT_EXISTENT') {
      throw new AppError({
        status,
        success: false,
        message: `The username doesn't belong to an account.`,
      });
    }

    if (status === 'PASS_INCORRECT') {
      throw new AppError({
        status,
        success: false,
        message: `Password was incorrect.`,
      });
    }

    if (status === 'CHECKPOINT') {
      await saveCookies(this.page, this.credentials.username);

      throw new AppError({
        status,
        success: false,
        message: `Checkpoint required.`,
      });
    }

    return status;
  }

  public async getUserData() {
    const _sharedData = await this.page.evaluate(
      () => window._sharedData.config.viewer,
    );

    // { id, fbid, full_name, profile_pic_url_hd, is_private, username }
    return _sharedData;
  }

  protected async waitForLogin() {
    await this.page.type('input[name="username"]', this.credentials.username);
    await this.page.type('input[name="password"]', this.credentials.password);
    await this.page.click('#loginForm [type="submit"]', { delay: 50 });

    const request = await this.page
      .waitForResponse(
        response =>
          response.url().includes('accounts/login/ajax/') &&
          response.request().method() === 'POST',
        { timeout: 10000 },
      )
      .then(response => response.json());

    const { user, authenticated, two_factor_required, checkpoint_url } =
      request;

    if (!user) {
      return 'USER_NOT_EXISTENT';
    }

    if (user && !authenticated) {
      return 'PASS_INCORRECT';
    }

    if (user && authenticated) {
      return 'CONNECTED';
    }

    if (checkpoint_url) {
      return 'CHECKPOINT';
    }

    console.log(request);
    return 'FINAL_LOGIN';
  }
}
