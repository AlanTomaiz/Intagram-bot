/* eslint no-plusplus: "off" */
import { getCustomRepository } from 'typeorm';
import puppeteer from 'puppeteer';
import path from 'path';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

import { saveCookies } from '../utils/handleFiles';

type AppBrowser = puppeteer.Page;

interface Credentials {
  user: string;
  pass: string;
  total_ref: number;
}

interface SharedData {
  id: number;
  fbid: number;
  full_name: string;
  profile_pic_url_hd: string;
  username: string;
}

export default class HandleRelogin {
  private repository: AccountRepository;

  private browser: puppeteer.Browser;

  async run(): Promise<void> {
    this.repository = getCustomRepository(AccountRepository);

    const repository = getCustomRepository(OldAccountsRepository);
    const oldUsers = await repository.index();

    console.log('Open browser');
    this.browser = await puppeteer.launch({
      // ignoreHTTPSErrors: true,
      // headless: false,
      args: ['--no-sandbox'],
    });

    for await (const user of oldUsers) {
      try {
        await this.relogin({
          user: user.username,
          pass: user.password,
          total_ref: user.total_ref,
        });
      } catch (error) {
        user.status = 3;
        await repository.save(user);
      }
    }

    await this.browser.close();
    console.info('Done');
  }

  async relogin({ user, pass, total_ref }: Credentials): Promise<void> {
    const page = await this.browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    );

    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('input[name="username"]', {
      visible: true,
      timeout: 20000,
    });

    // -- Envio de credênciais
    await page.type('input[name="username"]', user, { delay: 50 });
    await page.type('input[name="password"]', pass, { delay: 50 });
    await page.click('#loginForm [type="submit"]', { delay: 50 });

    // -- Aguardando retorno do login
    const loginRequest = await page.waitForResponse(
      response =>
        response.url().includes('accounts/login/ajax/') &&
        response.request().method() === 'POST',
      // { timeout: 20000 },
    );

    const { authenticated } = await loginRequest.json();

    if (!authenticated) {
      console.log(`${user} - error`);

      const directory = path.resolve(`erros/error-${user}.png`);
      await page.screenshot({ path: directory });

      await page.close();
      throw new Error();
    }

    /**
     * A partir daqui começo considerar
     * que esta tudo certo e usuario logado
     */

    // -- Aguarda carregamento da page
    await page.waitForSelector('input[placeholder="Pesquisar"]', {
      timeout: 20000,
    });

    // -- Salva informações de cookies
    const newCookies = await page.cookies();
    await saveCookies(user, newCookies);

    const _sharedData = await this.userData(page);
    const { id, fbid, full_name, profile_pic_url_hd, username } = _sharedData;

    const saveData = this.repository.create({
      fbid,
      instaid: id,
      avatar: profile_pic_url_hd,
      account_user: user,
      account_pass: pass,
      account_name: full_name,
      username,
      total_ref,
    });

    await this.repository.save(saveData);
    await page.close();

    console.log(`${user} - success`);
  }

  async userData(page: AppBrowser): Promise<SharedData> {
    const pageData = await page.evaluate(
      () => window._sharedData.config.viewer,
    );

    return pageData;
  }
}
