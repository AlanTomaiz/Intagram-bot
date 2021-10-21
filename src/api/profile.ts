/* eslint no-empty: "off", @typescript-eslint/no-empty-function: "off" */
import { Page } from 'puppeteer';

import AppError from '../errors/app-error';
import Sleep from '../utils/sleep';
import { logger } from '../utils/logger';
import { Credentials } from '../config/types';
import {
  getInterfaceStatus,
  userInterface,
  saveCookies,
} from '../controllers/auth';

export default class Profile {
  readonly credentials: Credentials;

  constructor(public page: Page, credentials: Credentials) {
    this.credentials = credentials;
  }

  async _initialize() {
    const status = await getInterfaceStatus(this.page);

    if (status === 'CONNECTED') {
      await this.page.waitForSelector('input[placeholder="Search"]', {
        visible: true,
        timeout: 10000,
      });

      await saveCookies(this.page, this.credentials.username);
      return { success: true, message: `Login with success!` };
    }

    if (status === 'CHECKPOINT') {
      throw new AppError({
        status: `CHECKPOINT`,
        message: `Checkpoint required.`,
      });
    }

    if (status === 'DISCONNECTED') {
      return this.waitForLogin();
    }

    throw new Error('TIMEOU');
  }

  async getUserData() {
    const _sharedData = await this.page.evaluate(
      () => window._sharedData.config.viewer,
    );

    // { id, fbid, full_name, profile_pic_url_hd, is_private, username }
    return _sharedData;
  }

  async verifyUserInterface() {
    await this.page.waitForNavigation({
      waitUntil: 'domcontentloaded',
    });

    await Sleep(500);
    const status = await userInterface(this.page);

    if (status === 'CONFIRM_CONNECTED') {
      // await this.page.click('main section button');

      await this.page.goto('https://www.instagram.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
    }

    if (status === 'CONNECTED' || status === 'CONFIRM_CONNECTED') {
      await saveCookies(this.page, this.credentials.username);
      return { success: true, message: `Login with success!` };
    }

    if (status === 'NEW_TEST_INTERFACE') {
      throw new Error('TIMEOU');
    }

    throw new AppError({
      status: `CHECKPOINT`,
      message: `Checkpoint required.`,
    });
  }

  async waitForLogin() {
    logger.info('Initialize login...');

    await this.page.type('input[name="username"]', this.credentials.username);
    await this.page.type('input[name="password"]', this.credentials.password);
    await this.page.click('#loginForm [type="submit"]', { delay: 50 });

    const request = await this.page
      .waitForResponse(
        response =>
          response.url().includes('accounts/login/ajax') &&
          response.request().method() === 'POST',
        { timeout: 10000 },
      )
      .then(response => response.json())
      .catch(err => {
        if (String(err).includes('Timeout')) {
          return 'TIMEOUT';
        }

        console.error('request error', err);
        return 'ERROR_LOGIN';
      });

    // console.log('waitForLogin request', request);

    const {
      user,
      authenticated,
      two_factor_required,
      oneTapPrompt,
      checkpoint_url,
      reactivated,
      spam,
    } = request;

    if (spam || request === 'TIMEOUT') {
      console.log('TIMEOU request', request);
      throw new Error('TIMEOU');
    }

    if (oneTapPrompt) {
      return this.verifyUserInterface();
    }

    if (checkpoint_url) {
      throw new AppError({
        status: `CHECKPOINT`,
        message: `Checkpoint required.`,
      });
    }

    if (two_factor_required) {
      throw new AppError({
        status: `TWO_FACTOR`,
        message: `Two-factor authentication.`,
      });
    }

    if (reactivated) {
      return this.verifyUserInterface();
    }

    if (!user) {
      throw new AppError({
        status: `USER_NOT_EXISTENT`,
        message: `The username doesn't belong to an account.`,
      });
    }

    if (user && !authenticated) {
      throw new AppError({
        status: `PASS_INCORRECT`,
        message: `Password was incorrect.`,
      });
    }

    if (user && authenticated) {
      return this.verifyUserInterface();
    }

    return 'NEW_TEST_FINAL_LOGIN';
  }
}
