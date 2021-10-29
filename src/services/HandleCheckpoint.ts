import { getManager } from 'typeorm';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';

import { Credentials } from '../config/types';
import { logger } from '../utils/logger';
import { getRandomPort } from '../utils/handlePorts';

export default class HandleCheckpoint {
  async run({ username, password, code }: Credentials): Promise<any> {
    logger.info('Start proccess checkpoint.');

    const manager = getManager();
    const credentials = { username, password };

    const port = await getRandomPort();
    const { browser, page } = await create({ username, proxy_port: port });

    const client = new Instagram({ browser, page, credentials });
    const { status, data, message } = await client.startLogin();

    console.log({ status, data, message });

    await client.close();
    throw new Error(message);
  }
}
