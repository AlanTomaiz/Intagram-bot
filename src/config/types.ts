import { Browser } from 'puppeteer';

export interface Credentials {
  username: string;
  password: string;
  relogin?: boolean;
}

export interface ResponseLogin {
  status: string;
  message: string;
}

export interface InstagramProps {
  browser: Browser;
  credentials: Credentials;
  relogin?: boolean;
}
