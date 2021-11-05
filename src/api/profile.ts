/* eslint no-empty: "off", @typescript-eslint/no-empty-function: "off" */
import { Page } from 'puppeteer';

import AppError from '../errors/app-error';
import Sleep from '../utils/sleep';
import { Credentials } from '../config/types';

import {
  getInterfaceStatus,
  userInterface,
  saveCookies,
} from '../controllers/auth';

export default class Profile {
  readonly credentials: Credentials;

  readonly only_relogin: boolean;

  constructor(public page: Page, credentials: Credentials, relogin = false) {
    this.credentials = credentials;
    this.only_relogin = relogin;
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
    await this.page.goto(
      `https://www.instagram.com/${this.credentials.username}`,
      { waitUntil: 'domcontentloaded' },
    );

    await Sleep(500);
    const _sharedData = await this.page.evaluate(
      // @ts-expect-error Error de type
      () => window._sharedData.entry_data.ProfilePage[0].graphql.user,
    );

    const {
      id,
      fbid,
      full_name,
      is_private,
      biography,
      edge_follow: { count: following },
      edge_followed_by: { count: followers },
      edge_owner_to_timeline_media: { count: publications },
    } = _sharedData;

    return {
      id,
      fbid,
      full_name,
      is_private,
      biography,
      following,
      followers,
      publications,
    };
  }

  async verifyUserInterface() {
    try {
      await this.page.waitForNavigation({
        waitUntil: 'domcontentloaded',
      });
    } catch {}

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
      await this.page.screenshot({
        path: `temp/page-verify-interface-${new Date().getTime()}.png`,
      });

      throw new Error('TIMEOU');
    }

    throw new AppError({
      status: `CHECKPOINT`,
      message: `Checkpoint required.`,
    });
  }

  async verifyProfile() {
    await Sleep(500);
    const status = await userInterface(this.page);

    if (status === 'CONNECTED') {
      return true;
    }

    return false;
  }

  async waitForLogin() {
    await this.page.waitForSelector('input[name="username"]');

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
      .catch(() => {
        throw new Error('TIMEOU');
      });

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
      throw new Error('TIMEOU');
    }

    if (oneTapPrompt) {
      return this.verifyUserInterface();
    }

    if (checkpoint_url) {
      return this.HandleRequestCheckpoint();
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

  async HandleRequestCheckpoint() {
    if (this.only_relogin) {
      throw new AppError({
        status: `CHECKPOINT`,
        message: `Checkpoint required.`,
      });
    }

    // Start checkpoint actions
    await this.page.waitForNavigation({
      waitUntil: 'domcontentloaded',
    });

    //
    const recaptcha = await this.page.$('#recaptcha-input');
    if (recaptcha) {
      throw new AppError({
        status: `DISABLED`,
        message: `Your Account Has Been Disabled.`,
      });
    }

    await this.page.waitForSelector('form', { timeout: 10000 });

    const submitButton = (await this.page.$x('//button[text()="Submit"]'))[0];
    const sendButton = (
      await this.page.$x('//button[text()="Send Security Code"]')
    )[0];

    if (!sendButton && submitButton) {
      throw new AppError({
        status: `CODE_CHECKPOINT`,
        message: `Checkpoint required.`,
      });
    }

    if (!sendButton) {
      throw new AppError({
        status: `CHECKPOINT`,
        message: `Checkpoint required.`,
      });
    }

    await sendButton.click();

    // -- Aguardando dados do challenge
    await this.page.waitForResponse(
      response =>
        response.url().includes('challenge/') &&
        response.request().method() === 'POST',
      { timeout: 10000 },
    );

    await saveCookies(this.page, this.credentials.username);

    throw new AppError({
      status: `CODE_CHECKPOINT`,
      message: `Checkpoint required.`,
    });
  }

  async ConfirmCheckpoint(code: string) {
    await Sleep(500);

    const submitButton = (await this.page.$x('//button[text()="Submit"]'))[0];
    await this.page.type('input[id="security_code"]', code);

    if (!submitButton) {
      throw new Error('TIMEOU');
    }

    await submitButton.click();

    // -- Aguardando dados do challenge
    const { status } = await this.page
      .waitForResponse(
        response =>
          response.url().includes('challenge/') &&
          response.request().method() === 'POST',
        { timeout: 10000 },
      )
      .then(response => response.json());

    if (status === 'fail') {
      throw new AppError({
        status: `ERROR_CHECKPOINT`,
        message: `Please check the code and try again.`,
      });
    }

    return this.verifyUserInterface();
  }
}
