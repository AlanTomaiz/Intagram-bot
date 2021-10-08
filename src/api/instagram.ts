import { Page } from 'puppeteer';

import { Credentials } from '../config/types';
import Profile from './profile';

export default class Instagram extends Profile {
  constructor(public page: Page, credentials: Credentials) {
    super(page, credentials);
  }
}
