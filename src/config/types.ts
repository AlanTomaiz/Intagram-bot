import { Page, Browser } from 'puppeteer';

export interface Credentials {
  username: string;
  password: string;
}

export interface ResponseLogin {
  status: string;
  message: string;
  type?: string;
  checkpoint_url?: string;
  data?: any;
}

export interface InstagramProps {
  browser: Browser;
  page: Page;
  credentials: Credentials;
  relogin?: boolean;
}
