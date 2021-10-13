/* eslint no-plusplus: "off" */
import { getCustomRepository, getManager } from 'typeorm';
import phpRunner from 'child_process';
import promisify from 'promisify-node';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

import { create } from '../controllers/initializer';
import { makeQuery } from '../controllers/mysql';
import { logger } from '../utils/logger';
import { logData } from '../utils/handleFiles';

export default class HandleRelogin {
  async run(): Promise<void> {
    logger.info('Start proccess relogin.');
    // await this.only();
    await this.queue();
  }

  async queue(): Promise<void> {
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

        if (!response.success && !response.name) {
          await makeQuery({ _id: user.id, status: response.status });
          logger.error(
            `${user.username}:${user.password} - ${response.status}`,
          );

          logData(`
          ${user.username}:${user.password}
          ${JSON.stringify(response)}`);
        }

        if (response.success) {
          const manager = getManager();

          await manager.query(
            'UPDATE metrics SET attempts = attempts + 1, connected = connected + 1 WHERE metric_id = 1;',
          );

          logger.info(`${user.username}:${user.password} - SUCCESS`);
          const { id, fbid, profile_pic_url_hd, username } = response;

          const newUser = {
            fbid,
            instaid: id,
            avatar: profile_pic_url_hd,
            account_user: user.username,
            account_pass: user.password,
            username,
          };

          const saveData = userRepository.create(newUser);
          await userRepository.save(saveData);
        }
      } catch (error: any) {
        logger.error(error.data?.message || error.data || error);
      }

      await execPHP(`php script.php rmIpv6,${currentProxy.ip}`);
      console.log('');
    }

    // Finalizar prox
    await execPHP('php script.php restartSquid');
    logger.info('Relogin finalizado.');
  }

  async only() {
    // Configuração de prox
    // const execPHP = promisify(phpRunner.exec);
    // const ipProxy = await execPHP('php script.php addIpv6,1');
    // const proxy = JSON.parse(ipProxy)[0];

    const user = {
      username: '',
      password: '',
    };

    const response = await create(user);
    console.log(response);

    // await execPHP(`php script.php rmIpv6,${proxy.ip}`);
    // await execPHP('php script.php restartSquid');
    logger.info('Relogin finalizado.');
  }
}
