import puppeteer from 'puppeteer';
import { getCustomRepository } from 'typeorm';

import AccountRepository from '../repositories/AccountRepository';

import RequestError from '../errors/request-error';
import AppError from '../errors/app-error';
import { getCookies, saveCookies } from '../utils/handleFiles';

type AppBrowser = puppeteer.Page;

interface Credentials {
  user: string;
  pass: string;
}

interface SharedData {
  id: number;
  fbid: number;
  full_name: string;
  profile_pic_url_hd: string;
  username: string;
}

interface Response {
  success: boolean;
  checkpoint: boolean;
  message: string;
}

declare global {
  interface Window {
    _sharedData: any;
  }
}

export default class HandleLogin {
  args = ['--no-sandbox'];

  async run({ user, pass }: Credentials): Promise<void> {
    const repository = getCustomRepository(AccountRepository);

    const browser = await puppeteer.launch({
      // headless: false,
      args: this.args,
    });

    const [page] = await browser.pages();

    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    );

    // -- Setting cookies
    const cookies = await getCookies(user);
    await page.setCookie(...cookies);

    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'domcontentloaded',
    });

    const profile = await this.userData(page);

    // if (profile) {}

    /**
     * A partir daqui considero que o usuario não esta logado e
     * faço todos processos de login e cookies
     */
    await page.waitForSelector('input[name="username"]', {
      visible: true,
      timeout: 10000,
    });

    // -- Envio de credênciais
    await page.type('input[name="username"]', user, { delay: 15 });
    await page.type('input[name="password"]', pass, { delay: 15 });
    await page.click('#loginForm [type="submit"]', { delay: 20 });

    // -- Aguardando retorno do login
    const loginRequest = await page.waitForResponse(
      response =>
        response.url().includes('accounts/login/ajax/') &&
        response.request().method() === 'POST',
      { timeout: 10000 },
    );

    // const loginResponse = await loginRequest.json();
    const { authenticated, two_factor_required, checkpoint_url } =
      await loginRequest.json();

    if (checkpoint_url) {
      const response = await this.HandleCheckpoint(page);

      // -- Salva informações de cookies
      const newCookies = await page.cookies();
      await saveCookies(user, newCookies);

      await browser.close();
      throw new AppError(response, 401);
    }

    if (two_factor_required) {
      await browser.close();

      throw new RequestError(
        'A autenticação de dois fatores da sua conta está ligada. Para utilizar o sistema, você deve desabilita-la.',
      );
    }

    if (!authenticated) {
      await browser.close();

      throw new RequestError(
        'Não foi possível realizar seu login, verifique suas credenciais.',
      );
    }

    // -- Aguarda carregamento da page
    await page.waitForSelector('input[placeholder="Pesquisar"]', {
      timeout: 5000,
    });

    // await page.goto('https://www.instagram.com/p/CSS5-UzAG4j/');
    // await page.click('[type="button"] [aria-label="Curtir"]');
    // await page.screenshot({ path: 'temp/page.png' });

    /**
     * A partir daqui começo considerar
     * que esta tudo certo e usuario logado
     */

    // -- Salva informações de cookies
    const newCookies = await page.cookies();
    await saveCookies(user, newCookies);

    const _sharedData = await this.userData(page);
    const { id, fbid, full_name, profile_pic_url_hd, username } = _sharedData;

    const saveData = repository.create({
      fbid,
      instaid: id,
      avatar: profile_pic_url_hd,
      account_user: user,
      account_pass: pass,
      account_name: full_name,
      username,
    });

    await repository.save(saveData);
    await browser.close();
  }

  async userData(page: AppBrowser): Promise<SharedData> {
    const pageData = await page.evaluate(
      () => window._sharedData.config.viewer,
    );

    return pageData;
  }

  async HandleCheckpoint(page: AppBrowser): Promise<Response> {
    await page.waitForResponse(
      response =>
        response.url().includes('challenge/') &&
        response.request().method() === 'GET',
      { timeout: 10000 },
    );

    await page.waitForSelector('form', { timeout: 10000 });
    const sendButton = (await page.$x('//button[text()="Enviar"]'))[0];

    if (sendButton) {
      return {
        success: false,
        checkpoint: true,
        message: `Confirmação de login necessária. Foi enviado um código por e-mail / SMS. Informe abaixo o código recebido:`,
      };
    }

    const submitButton = (
      await page.$x('//button[text()="Enviar código de segurança"]')
    )[0];

    if (!submitButton) {
      const exitButton = (await page.$x('//a[text()="Sair"]'))[0];
      await exitButton.click();

      return {
        success: false,
        checkpoint: true,
        message: `É necessário acessar sua conta diretamente no <a href="https://www.instagram.com/" target="_blank">Instagram (Clique Aqui)</a> e autorizar o acesso ao nosso sistema em sua conta.`,
      };
    }

    await submitButton.click();

    // -- Aguardando dados do challenge
    const challengeRequest = await page.waitForResponse(
      response =>
        response.url().includes('challenge/') &&
        response.request().method() === 'POST',
      { timeout: 10000 },
    );

    const { fields } = await challengeRequest.json();
    const { phone_number, contact_point } = fields;

    const contact = phone_number || contact_point;

    return {
      success: false,
      checkpoint: true,
      message: `Confirmação de login necessária. Foi enviado um código para ${contact}. Informe abaixo o código recebido:`,
    };
  }
}
