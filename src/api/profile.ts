/* eslint no-empty: "off" */
import { Page } from 'puppeteer';

import AppError from '../errors/app-error';
import { Credentials } from '../config/types';
import { getInterfaceStatus, saveCookies } from '../controllers/auth';

interface Response {
  status: string;
  success: boolean;
  message: string;
}

export default class Profile {
  readonly credentials: Credentials;

  constructor(public page: Page, credentials: Credentials) {
    this.credentials = credentials;
  }

  public async _initialize(): Promise<Response> {
    let status = await getInterfaceStatus(this.page);

    if (status === 'DISCONNECTED') {
      status = await this.waitForLogin();
    }

    if (status === 'CONNECTED') {
      try {
        await this.page.waitForSelector('input[placeholder="Search"]', {
          timeout: 2000,
        });

        await saveCookies(this.page, this.credentials.username);
        return { status, success: true, message: `Login with success!` };
      } catch {
        throw new AppError(`Error on save cookies.`);
      }
    }

    if (status === 'USER_NOT_EXISTENT') {
      return {
        status,
        success: false,
        message: `The username doesn't belong to an account.`,
      };
    }

    if (status === 'PASS_INCORRECT') {
      return {
        status,
        success: false,
        message: `Password was incorrect.`,
      };
    }

    if (status === 'CHECKPOINT') {
      await saveCookies(this.page, this.credentials.username);

      return {
        status,
        success: false,
        message: `Checkpoint required.`,
      };
    }

    if (status === 'NEW_TEST_INTERFACE') {
      await this.page.screenshot({
        path: `temp/page-${new Date().getTime()}.png`,
      });

      return {
        status,
        success: false,
        message: `Novo teste`,
      };
    }

    return {
      status: String(status),
      success: false,
      message: `NEW_TESTE__initialize`,
    };
  }

  public async getUserData() {
    const _sharedData = await this.page.evaluate(
      () => window._sharedData.config.viewer,
    );

    // { id, fbid, full_name, profile_pic_url_hd, is_private, username }
    return _sharedData;
  }

  protected async waitForLogin() {
    console.log('waitForLogin');
    await this.page.type('input[name="username"]', this.credentials.username);
    await this.page.type('input[name="password"]', this.credentials.password);
    await this.page.click('#loginForm [type="submit"]', { delay: 50 });

    const request = await this.page
      .waitForResponse(
        response =>
          response.url().includes('accounts/login/ajax/') &&
          response.request().method() === 'POST',
        { timeout: 30000 },
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

    console.log('waitForLogin request', request);
    return 'FINAL_LOGIN';
  }
}
