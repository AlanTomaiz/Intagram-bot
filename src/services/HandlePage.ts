/* eslint class-methods-use-this: "off" */
import puppeteer from 'puppeteer';
import { getCookies, saveCookies } from '../save-cookies';

interface Credentials {
  user: string;
  pass: string;
}

export default class HandlePage {
  args = ['--proxy-server=177.75.97.128:3128'];

  async run({ user, pass }: Credentials): Promise<void> {
    const browser = await puppeteer.launch({
      headless: false,
      args: this.args,
    });

    const [page] = await browser.pages();

    // -- Seta infromações de cookies
    const cookies = await getCookies('testaname');
    await page.setCookie(...cookies);

    await page.goto('https://www.instagram.com/');

    // -- Verificação de login
    try {
      await page.waitForFunction(
        'document.querySelector(\'[placeholder="Pesquisar"]\')',
        { timeout: 1000 },
      );
    } catch {
      // -- Envio de credênciais
      await page.type('[name="username"]', user);
      await page.type('[name="password"]', pass);
      await page.click('#loginForm [type="submit"]');
    }

    // -- Verificação de login 2
    try {
      await page.waitForFunction(
        'document.querySelector(\'[placeholder="Pesquisar"]\')',
        { timeout: 10000 },
      );

      // -- Salvar informações de cookies
      const newCookies = await page.cookies();
      await saveCookies('testaname', newCookies);
    } catch {
      // Usuário deslogado

      await page.screenshot({ path: 'digg-example.png' });
    }

    // await page.goto('https://www.instagram.com/p/CSS5-UzAG4j/');
    // await page.click('[type="button"] [aria-label="Curtir"]');

    await browser.close();
  }
}
