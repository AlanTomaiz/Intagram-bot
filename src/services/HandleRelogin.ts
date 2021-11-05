/* eslint no-plusplus: "off", no-continue: "off" */
import { getCustomRepository, getManager } from 'typeorm';

import OldAccountsRepository from '../repositories/OldAccountRepository';

import { logger } from '../utils/logger';
import { init as ReloadSquid } from '../utils/reloadSquid';
import HandleLogin from './HandleLogin';

export default class HandleRelogin {
  async run(): Promise<void> {
    logger.info('Start proccess relogin.');

    const manager = getManager();
    const repository = getCustomRepository(OldAccountsRepository);

    const loginService = new HandleLogin();
    const oldUsers = await repository.index();

    for await (const dataUser of oldUsers) {
      const { id, username, password } = dataUser;

      try {
        await loginService.run({ username, password, relogin: true });
      } catch (error) {
        const status = error.data?.status || error.message;

        if (status !== 'TIMEOU') {
          logger.error(`${username}:${password} - ${status}`);

          // Update usuarios table
          await manager.query(
            `UPDATE usuarios SET status = 3 WHERE id = ${id};`,
          );
        }
      }
    }

    ReloadSquid();
    logger.info('Relogin finalizado.');
  }
}
