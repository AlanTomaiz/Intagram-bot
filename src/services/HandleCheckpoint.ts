import { getManager } from 'typeorm';

import AppError from '../errors/app-error';
import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';

import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { getRandomPort } from '../utils/handlePorts';

interface Checkpoint extends Credentials {
  code: string;
}

export default class HandleCheckpoint {
  async run({ username, password, code }: Checkpoint): Promise<any> {
    logger.info('Start proccess checkpoint...');

    const manager = getManager();
    const credentials = { username, password };

    // const port = await getRandomPort();
    // const { browser, page } = await create({ username, proxy_port: port });
    const { browser, page } = await create({ username });

    const client = new Instagram({ browser, page, credentials });
    const response = await client.waitForLogin().catch(error => {
      const { data } = error;

      if (data.status === 'CODE_CHECKPOINT') {
        return true;
      }

      // TIMEOU
      if (!(error instanceof AppError)) {
        throw new Error(error.message);
      }

      throw new AppError(data);
    });

    // @ts-expect-error Error no type
    if (response?.success) {
      await page.screenshot({
        path: `temp/page-erro-checkpoint-type-1-${new Date().getTime()}.png`,
      });

      await client.close();
      throw new AppError({
        status: `ERROR`,
        message: `Login with success!`,
      });
    }

    const { success } = await client.ConfirmCheckpoint(code);

    if (!success) {
      await page.screenshot({
        path: `temp/page-erro-checkpoint-type-2-${new Date().getTime()}.png`,
      });

      await client.close();
      throw new AppError({
        status: `ERROR_CHECKPOINT`,
        message: `Please check the code and try again.`,
      });
    }

    const user = await client.getUserData();
    const { id, fbid, profile_pic_url_hd, full_name } = user;

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
