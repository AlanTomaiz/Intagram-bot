import { getManager } from 'typeorm';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';

import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { getRandomPort } from '../utils/handlePorts';

export default class HandleLogin {
  async run({ username, password }: Credentials): Promise<any> {
    logger.info('Start proccess login.');

    const manager = getManager();
    const credentials = { username, password };

    const port = await getRandomPort();
    const { browser, page } = await create({ username, proxy_port: port });

    const client = new Instagram({ browser, page, credentials });
    const { status, data, message } = await client.startLogin();

    if (status !== 'success') {
      await client.close();
      throw new Error(message);
    }

    const { id, fbid, profile_pic_url_hd, full_name } = data;

    await manager.query(`INSERT INTO accounts
    (account_user, account_pass, instaid, fbid, avatar)
    VALUES ('${username}', '${password}', '${id}', '${fbid}', '${profile_pic_url_hd}')
    ON DUPLICATE KEY UPDATE account_pass='${password}';`);

    await client.close();

    return {
      user_id: id,
      user_name: full_name || username,
      user_avatar: profile_pic_url_hd,
    };
  }
}
