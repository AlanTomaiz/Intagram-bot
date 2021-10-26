import { getManager } from 'typeorm';

import AccountRepository from '../repositories/AccountRepository';
import RequestError from '../errors/request-error';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';

import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { getRandomPort } from '../utils/handlePorts';

export default class HandleLogin {
  async run({ username, password, code }: Credentials): Promise<any> {
    const manager = getManager();
    const credentials = { username, password };

    logger.info('Start proccess login.');

    try {
      // const port = await getRandomPort();
      // const { browser, page } = await create({ username, proxy_port: port });
      const { browser, page } = await create({ username });

      const client = new Instagram({ browser, page, credentials });
      const { status, data, message, type } = await client.startLogin();

      if (type === 'CHECKPOINT' && code) {
        await client.ConfirmCheckpoint(code);
      }

      if (status === 'success') {
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

      await client.close();
      return { message, status: type };
    } catch {
      throw new RequestError(
        'Não foi possivel acessar os servidores do instagram, tente novamente',
      );
    }
  }
}
