/* eslint class-methods-use-this: "off", camelcase: "off" */
import puppeteer from 'puppeteer';
import { slug, log, getCookies, saveCookies } from '../utils/handleFiles';

import RequestError from '../errors/request-error';
import AppError from '../errors/app-error';

interface Credentials {
  user: string;
  pass: string;
}

export default class HandleLogin {
  args = ['--no-sandbox'];

  async run({ user, pass }: Credentials): Promise<void> {
    const browser = await puppeteer.launch({
      headless: false,
      args: this.args,
    });

    const [page] = await browser.pages();

    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    );

    // -- Infromações de cookies
    const cookies = await getCookies(user);
    await page.setCookie(...cookies);

    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle0',
    });

    // -- Verificação de login
    try {
      // -- Verifica se já esta logado
      await page.waitForSelector('input[placeholder="Pesquisar"]', {
        timeout: 2000,
      });

      /* Criar retorno para logado */
    } catch {
      await page.waitForSelector('input[name="username"]', {
        visible: true,
        timeout: 10000,
      });

      // -- Envio de credênciais
      await page.type('input[name="username"]', user, { delay: 15 });
      await page.type('input[name="password"]', pass, { delay: 15 });

      await page.click('#loginForm [type="submit"]', { delay: 20 });
    }

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

    try {
      if (checkpoint_url) {
        await page.waitForResponse(
          response =>
            response.url().includes('challenge/') &&
            response.request().method() === 'GET',
          { timeout: 10000 },
        );

        await page.waitForSelector('form button', { timeout: 2000 });

        const buttonSend = (await page.$x('//button[text()="Enviar"]'))[0];

        if (buttonSend) {
          const response = {
            success: false,
            checkpoint: true,
            message: `Confirmação de login necessária. Foi enviado um código por e-mail / SMS. Informe abaixo o código recebido:`,
          };

          throw new AppError(response, 401);
        }

        const buttonSubmit = (
          await page.$x('//button[text()="Enviar código de segurança"]')
        )[0];

        await buttonSubmit.click();

        // -- Aguardando dados do challenge
        const challengeRequest = await page.waitForResponse(
          response =>
            response.url().includes('challenge/') &&
            response.request().method() === 'POST',
          { timeout: 10000 },
        );

        const {
          fields: { phone_number, contact_point },
        } = await challengeRequest.json();

        // -- Salva informações de cookies
        const newCookies = await page.cookies();
        await saveCookies(user, newCookies);

        const contact = phone_number || contact_point;
        await browser.close();

        const response = {
          success: false,
          checkpoint: true,
          message: `Confirmação de login necessária. Foi enviado um código para ${contact}. Informe abaixo o código recebido:`,
        };

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

      // -- Verificação de login 2
      await page.waitForSelector('input[placeholder="Pesquisar"]', {
        timeout: 2000,
      });

      // -- Salva informações de cookies
      const newCookies = await page.cookies();
      await saveCookies(user, newCookies);
    } catch (error) {
      // Algum erro????
      const file_path = `temp/error-login-${slug(user)}.png`;

      await page.screenshot({ path: file_path });
      log(`Erro no usuario ${user} | file: ${file_path} | Erro:\r\n${error}`);
    }

    // await page.goto('https://www.instagram.com/p/CSS5-UzAG4j/');
    // await page.click('[type="button"] [aria-label="Curtir"]');
    // await page.screenshot({ path: 'temp/page.png' });

    await browser.close();
  }
}
