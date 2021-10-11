/* eslint no-plusplus: "off" */
import { getCustomRepository } from 'typeorm';
import phpRunner from 'child_process';
import promisify from 'promisify-node';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

import { create } from '../controllers/initializer';
import { makeQuery } from '../controllers/mysql';
import { TestConnection } from '../controllers/connection';
import { logger } from '../utils/logger';
import { logData } from '../utils/handleFiles';

export default class HandleRelogin {
  async run(): Promise<void> {
    // await TestConnection();

    logger.info('Start proccess relogin.');
    await this.start();
  }

  async start(): Promise<void> {
    const userRepository = getCustomRepository(AccountRepository);

    const repository = getCustomRepository(OldAccountsRepository);
    const oldUsers = await repository.index();

    // Configuração de prox
    const execPHP = promisify(phpRunner.exec);
    const ipProxy = await execPHP('php script.php addIpv6,100');
    const proxy = JSON.parse(ipProxy);
    let count = 0;

    for await (const user of oldUsers) {
      const currentProxy = proxy[count++];

      try {
        const response = await create(user, currentProxy.port);

        if (!response.success) {
          logger.error(`${user.username}:${user.password} - ERROR`);
          await makeQuery({ _id: user.id, status: response.status });

          logData(`
          ${user.username}:${user.password}
          ${JSON.stringify(response)}`);
        }

        if (response.fbid) {
          logger.info(`${user.username}:${user.password} - SUCCESS`);
          const { id, fbid, full_name, profile_pic_url_hd, username } =
            response;

          const newUser = {
            fbid,
            instaid: id,
            avatar: profile_pic_url_hd,
            account_user: user.username,
            account_pass: user.password,
            account_name: full_name,
            username,
          };

          const saveData = userRepository.create(newUser);
          await userRepository.save(saveData);
        }
      } catch (error: any) {
        logger.error(error.data.message);
      }

      await execPHP(`php script.php rmIpv6,${currentProxy.ip}`);
    }

    // Finalizar prox
    await execPHP('php script.php restartSquid');
  }
}
