import fs from 'fs/promises';

import { create } from '../controllers/initializer';

export default class HandleCookies {
  async run(): Promise<void> {
    const cookies = await this.listSavedCookies();

    // const username = cookies[1].replace('.data.json', '');

    // const instagram = await create({ username, password: '' });
    // console.log(instagram);

    for await (const user of cookies) {
      const username = user.replace('.data.json', '');
      console.log(username);

      const instagram = await create({ username, password: '' });

      if (instagram.status !== 'CONNECTED') {
        console.log(instagram);
      }
    }
  }

  async listSavedCookies() {
    const files = await fs.readdir(`cookies`);

    return files;
  }
}
