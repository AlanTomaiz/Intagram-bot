import { getManager } from 'typeorm';
import { sign } from 'jsonwebtoken';

import Instagram from '../controllers/instagram';
import { create } from '../controllers/initializer';

import authConfig from '../config/auth';
import { Credentials } from '../config/types';
import { getRandomPort } from '../utils/handlePorts';

interface Checkpoint extends Credentials {
  code: string;
}

export default class HandleCheckpoint {
  async run({ username, password, code }: Checkpoint): Promise<any> {
    const { secret, expiresIn } = authConfig;

    const manager = getManager();
    const credentials = { username, password };

    const port = await getRandomPort();
    const browser = await create({ username, proxy_port: port });

    const client = new Instagram({ browser, credentials });
    await client.getPage();
    await client.tryLogin(true);
    await client.confirmCheckpoint(code);

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
