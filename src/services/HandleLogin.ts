/* eslint class-methods-use-this: "off", camelcase: "off" */
import puppeteer from 'puppeteer';
import { getCookies, parseFilename, saveCookies } from '../utils/cookies';

import RequestError from '../errors/request-error';

interface Credentials {
  user: string;
  pass: string;
}

export default class HandleLogin {
  args = [];

  async run({ user, pass }: Credentials): Promise<void> {
    const browser = await puppeteer.launch({ args: this.args });
    const [page] = await browser.pages();

    // -- Infromações de cookies
    const cookies = await getCookies(user);
    await page.setCookie(...cookies);

    await page.goto('https://www.instagram.com/');

    // -- Verificação de login
    try {
      await page.waitForFunction(
        'document.querySelector(\'[placeholder="Pesquisar"]\')',
        { timeout: 2000 },
      );
    } catch {
      // -- Envio de credênciais
      await page.type('[name="username"]', user);
      await page.type('[name="password"]', pass);
      await page.click('#loginForm [type="submit"]');
    }

    // -- Verificação de login 2
    const loginResponse = await page.waitForResponse(
      response =>
        response.url().includes('accounts/login/ajax/') &&
        response.request().method() === 'POST',
      { timeout: 10000 },
    );

    const { authenticated, two_factor_required } = await loginResponse.json();

    if (!authenticated) {
      await browser.close();

      throw new RequestError(
        'Não foi possível realizar seu login, verifique suas credenciais.',
      );
    }

    if (two_factor_required) {
      await browser.close();

      throw new RequestError(
        'A autenticação de dois fatores da sua conta está ligada. Para utilizar o sistema, você deve desabilita-la.',
      );
    }

    try {
      await page.waitForFunction(
        'document.querySelector(\'[placeholder="Pesquisar"]\')',
        { timeout: 2000 },
      );

      // -- Salvar novas informações de cookies
      const newCookies = await page.cookies();
      await saveCookies(user, newCookies);
    } catch {
      // Algum erro????

      await page.screenshot({
        path: `temp/error-login-${parseFilename(user)}.png`,
      });
    }

    // await page.goto('https://www.instagram.com/p/CSS5-UzAG4j/');
    // // await page.click('[type="button"] [aria-label="Curtir"]');
    // await page.screenshot({ path: 'temp/page.png' });

    await browser.close();
  }
}
