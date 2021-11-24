import { getManager } from 'typeorm';
import { sign } from 'jsonwebtoken';

import authConfig from '../config/auth';
import Instagram from '../controllers/instagram';
import { logger } from '../utils/logger';
import { create } from '../controllers/initializer';
import { Credentials } from '../config/types';
import { getRandomPort } from '../utils/handlePorts';

export default class HandleLogin {
  async run({ username, password, relogin }: Credentials): Promise<any> {
    logger.info('Process login start...');
    const { secret, expiresIn } = authConfig;

    const manager = getManager();
    const credentials = { username, password };

    const port = await getRandomPort();
    const browser = await create({ username, proxy_port: port });

    const client = new Instagram({ browser, credentials, relogin });
    await client.login();

    const {
      id,
      fbid,
      full_name,
      is_private,
      biography,
      following,
      followers,
      publications,
    } = await client.getUserData(username);

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
