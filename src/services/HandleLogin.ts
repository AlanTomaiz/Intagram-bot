import { getManager } from 'typeorm';
import { sign } from 'jsonwebtoken';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';

import authConfig from '../config/auth';
import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { getRandomPort } from '../utils/handlePorts';

export default class HandleLogin {
  async run({ username, password, relogin }: Credentials): Promise<any> {
    console.log('');
    logger.info('Start proccess login.');

    const { secret, expiresIn } = authConfig;

    const manager = getManager();
    const credentials = { username, password };

    const port = await getRandomPort();
    const { browser, page } = await create({ username, proxy_port: port });

    const client = new Instagram({ browser, page, credentials, relogin });
    await client.startLogin();

    const {
      id,
      fbid,
      full_name,
      is_private,
      biography,
      following,
      followers,
      publications,
    } = await client.getUserData();

    await manager.query(`INSERT INTO accounts
    (account_user, account_pass, instaid, fbid)
    VALUES ('${username}', '${password}', '${id}', '${fbid}')
    ON DUPLICATE KEY UPDATE account_pass='${password}';`);

    await client.close();
    const token = sign({}, secret, {
      subject: id,
      expiresIn,
    });

    const user = {
      user_id: id,
      username,
      biography,
      is_private,
      following,
      followers,
      publications,
      user_name: full_name || username,
    };

    return { user, token };
  }
}
