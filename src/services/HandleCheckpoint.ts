import { getManager } from 'typeorm';
import { sign } from 'jsonwebtoken';

import AppError from '../errors/app-error';
import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';

import authConfig from '../config/auth';
import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
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
    const { browser, page } = await create({ username, proxy_port: port });

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
    if (!response.success) {
      const { success } = await client.ConfirmCheckpoint(code).catch(error => {
        const error_message = error.data.message || error.message;

        logger.error(`Catch checkpoint: ${error_message}`);
        return { success: false };
      });

      if (!success) {
        await client.close();

        throw new AppError({
          status: `ERROR_CHECKPOINT`,
          message: `Please check the code and try again.`,
        });
      }
    }

    try {
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
    } catch {
      await client.close();

      throw new AppError({
        status: `FAILED`,
        message: `Please try again.`,
      });
    }
  }
}
