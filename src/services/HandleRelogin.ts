/* eslint no-plusplus: "off" */
import { getCustomRepository } from 'typeorm';
import promisify from 'promisify-node';
import phpRunner from 'child_process';
import puppeteer from 'puppeteer';
import useProxy from 'puppeteer-page-proxy';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

import { log, saveCookies } from '../utils/handleFiles';

type AppBrowser = puppeteer.Page;

interface Credentials {
  user: string;
  pass: string;
  total_ref: number;
  proxy_port: number;
}

interface ProxyList {
  ip: string;
  port: number;
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

  private proxy: ProxyList[];

  private data: Credentials;

  async run(): Promise<void> {
    this.repository = getCustomRepository(AccountRepository);

    const repository = getCustomRepository(OldAccountsRepository);
    const oldUsers = await repository.index();

    // Proxy
    const execPHP = promisify(phpRunner.exec);
    const ipProxy = await execPHP('php script.php addIpv6');
    this.proxy = JSON.parse(ipProxy);

    console.log('Open browser');
    this.browser = await puppeteer.launch({
      // headless: false,
      args: ['--no-sandbox'],
    });

    for await (const [index, user] of oldUsers.entries()) {
      try {
        // await this.testConnection(this.proxy[index].port);

        this.data = {
          user: user.username,
          pass: user.password,
          total_ref: user.total_ref,
          proxy_port: this.proxy[index].port,
        };

        await this.relogin();
      } catch (error) {
        log(error.message);

        user.status = 3;
        await repository.save(user);
      }
    }

    for await (const item of this.proxy) {
      await execPHP(`php script.php rmIpv6,${item.ip}`);
    }

    await execPHP('php script.php restartSquid');
    await this.browser.close();
    console.info('Done');
  }

  // async testConnection(port: number): Promise<void> {
  //   const page = await this.browser.newPage();
  //   await useProxy(page, `http://localhost:${port}`);

  //   await page.setUserAgent(
  //     'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
  //   );

  //   await page.goto('https://whatismyv6.com/', {
  //     waitUntil: 'domcontentloaded',
  //     timeout: 20000,
  //   });

  //   await page.screenshot({
  //     path: `prints/whatismyv6-${Math.floor(Math.random() * 142436460)}.png`,
  //   });

  //   await page.close();
  // }

  async userData(page: AppBrowser): Promise<SharedData> {
    const pageData = await page.evaluate(
      () => window._sharedData.config.viewer,
    );

    return pageData;
  }

  async relogin(): Promise<void> {
    const { user, pass, total_ref, proxy_port } = this.data;

    const page = await this.browser.newPage();
    await useProxy(page, `http://localhost:${proxy_port}`);

    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    );

    await page.goto('https://www.instagram.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
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
      { timeout: 20000 },
    );

    const loginResponse = await loginRequest.json();
    const { authenticated } = loginResponse;

    try {
      await page.waitForSelector('#slfErrorAlert', {
        visible: true,
        timeout: 20000,
      });
    } catch {
      // ignora erro caso tenha logado
    }

    const errorMessage = await page.evaluate(
      () => document.getElementById('slfErrorAlert')?.innerHTML,
    );

    if (errorMessage?.includes('internet')) {
      console.log('Erro de internet', loginResponse);
      await page.screenshot({ path: `erros/internet-${user}.png` });

      await page.close();
      return;
    }

    if (!authenticated) {
      log(JSON.stringify(loginResponse));
      await page.screenshot({ path: `erros/${user}.png` });

      await page.close();
      throw new Error(`${user} - error`);
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
}
