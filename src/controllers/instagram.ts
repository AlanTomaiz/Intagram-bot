/* eslint no-restricted-globals: "off", no-empty: "off" */
import { ElementHandle, Browser, Page } from 'puppeteer';

import Utils from './utils';
import AppError from '../errors/app-error';
import { logger } from '../utils/logger';
import { Credentials, InstagramProps } from '../config/types';
import { tryDeleteCookies, trySaveCookies, trySendCookies } from './auth';

export default class Instagram extends Utils {
  browser: Browser;

  page: Page;

  credentials: Credentials;

  relogin: boolean | undefined;

  constructor({ browser, credentials, relogin }: InstagramProps) {
    super();

    this.relogin = relogin;
    this.browser = browser;
    this.credentials = credentials;
  }

  async getPage() {
    const [page] = await this.browser.pages();

    if (!page) {
      await this.close();
      throw new Error(`Error accessing page.`);
    }

    this.page = page;
  }

  async isLoggedIn() {
    if (!this.page) {
      await this.getPage();
    }

    return (await this.page.$x('//*[@aria-label="Home"]')).length === 1;
  }

  async goHome() {
    await this.page.goto('https://www.instagram.com/');
  }

  async navigateToUser(username: string) {
    const response = await this.page.goto(
      `https://www.instagram.com/${username}`,
      { waitUntil: 'domcontentloaded' },
    );

    await this.sleep(1000);
    const status = response.status();

    if (status === 200) {
      return true;
    }

    if (status === 404) {
      logger.log('User not found');
      return false;
    }

    this.close();
    throw new Error(`Navigate to user returned status ${response.status()}`);
  }

  async getUserData(username: string) {
    await this.navigateToUser(username);

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

  async tryPressButton(element: ElementHandle[], name: string) {
    try {
      if (element.length === 1) {
        logger.info(`Pressing button: ${name}`);

        element[0].click();
        await this.sleep(3000);
      }
    } catch (err) {
      logger.warn(`Failed to press button: ${name}`);
    }
  }

  async verifyUserInterface() {
    const { username, password } = this.credentials;

    await this.sleep(1000);
    if (!(await this.isLoggedIn())) {
      // Still not logged in, trying to reload loading page
      await this.page.reload();
      await this.sleep(5000);
    }

    if (!(await this.isLoggedIn())) {
      // WARNING: Login has not succeeded.
      await this.close();

      throw new AppError({
        status: `failed`,
        message: `Login has not succeeded.`,
      });
    }

    await this.tryPressButton(
      await this.page.$x('//button[text()="Save Info"]'),
      'Login info dialog: Save Info',
    );

    await this.sleep(1000);
    await this.tryPressButton(
      await this.page.$x('//button[text()="Allow All Cookies"]'),
      'Accept use cookies dialog',
    );

    await this.tryPressButton(
      await this.page.$x('//button[text()="Not Now"]'),
      'Turn on Notifications dialog',
    );

    await trySaveCookies(this.page, username);

    await trySendCookies({
      page: this.page,
      user: username,
      pass: password,
    });
  }

  async waitForLogin() {
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
      await this.page.screenshot({
        path: `temp/page-erro-${new Date().getTime()}.png`,
      });

      await this.close();

      throw new AppError({
        status: `timeout`,
        message: `Wait a few minutes and try again.`,
      });
    }

    if (reactivated) {
      await this.verifyUserInterface();
      return;
    }

    if (oneTapPrompt) {
      await this.verifyUserInterface();
      return;
    }

    if (checkpoint_url) {
      await this.handleCheckpoint();
      return;
    }

    if (two_factor_required) {
      await this.close();

      throw new AppError({
        status: `two_factor`,
        message: `Two-factor authentication.`,
      });
    }

    if (!user) {
      await this.close();

      throw new AppError({
        status: `user_not_existent`,
        message: `The username doesn't belong to an account.`,
      });
    }

    if (user && !authenticated) {
      await this.close();

      throw new AppError({
        status: `pass_incorrect`,
        message: `Password was incorrect.`,
      });
    }
  }

  async handleCheckpoint() {
    if (this.relogin) {
      await this.close();

      throw new AppError({
        status: `checkpoint`,
        message: `Checkpoint required.`,
      });
    }

    await this.sleep(6000);

    const recaptcha = await this.page.$('#recaptcha-input');
    if (recaptcha) {
      await this.close();

      throw new AppError({
        status: `disabled`,
        message: `Your Account Has Been Disabled.`,
      });
    }

    // ---
    const submitButton = (await this.page.$x('//button[text()="Submit"]'))[0];
    const sendButton = (
      await this.page.$x('//button[text()="Send Security Code"]')
    )[0];

    if (!sendButton || submitButton) {
      await this.close();

      throw new AppError({
        status: `checkpoint`,
        message: `Checkpoint required.`,
      });
    }

    await sendButton.click();

    try {
      await this.page.waitForResponse(
        response =>
          response.url().includes('challenge/') &&
          response.request().method() === 'POST',
        { timeout: 10000 },
      );
    } catch (err) {
      await this.close();

      throw new AppError({
        status: `failed`,
        message: `Login has not succeeded.`,
      });
    }

    await trySaveCookies(this.page, this.credentials.username);
    await this.close();

    throw new AppError({
      status: `checkpoint`,
      message: `Checkpoint required.`,
    });
  }

  async confirmCheckpoint(code: string) {
    if (!code) {
      await this.close();

      throw new AppError({
        status: `code_required`,
        message: `You must enter the verification code.`,
      });
    }

    try {
      await this.page.waitForSelector('input[id="security_code"]');
    } catch (err) {
      await this.close();

      throw new AppError({
        status: `failed`,
        message: `Confirmation checkpoint has not succeeded.`,
      });
    }

    await this.page.type('input[id="security_code"]', code);
    const submitButton = (await this.page.$x('//button[text()="Submit"]'))[0];
    if (!submitButton) {
      await this.close();

      throw new AppError({
        status: `failed`,
        message: `Login has not succeeded.`,
      });
    }

    await submitButton.click();
    const { status } = await this.page
      .waitForResponse(
        response =>
          response.url().includes('challenge/') &&
          response.request().method() === 'POST',
        { timeout: 10000 },
      )
      .then(response => response.json());

    if (status === 'fail') {
      await this.close();

      throw new AppError({
        status: `checkpoint_failed`,
        message: `Please check the code and try again.`,
      });
    }

    console.log('status challenger', status);
  }

  async tryLogin(checkpoint = false) {
    const { username, password } = this.credentials;

    try {
      await this.page.waitForSelector('input[name="username"]');
    } catch (err) {
      console.log('?', err);
      await this.close();

      throw new AppError({
        status: `failed`,
        message: `Login has not succeeded.`,
      });
    }

    await this.page.type('input[name="username"]', username, { delay: 50 });
    await this.page.type('input[name="password"]', password, { delay: 50 });
    await this.sleep(500);
    await this.page.click('#loginForm [type="submit"]', { delay: 50 });

    if (checkpoint) {
      return;
    }

    await this.waitForLogin();
  }

  async login() {
    if (!(await this.isLoggedIn())) {
      tryDeleteCookies(this.credentials.username);
      await this.tryLogin();
    }

    await this.verifyUserInterface();
  }

  async close() {
    logger.info('Close browser.');
    await this.browser.close();
  }
}
