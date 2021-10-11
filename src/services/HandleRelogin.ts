/* eslint no-plusplus: "off" */
import { getCustomRepository, getManager } from 'typeorm';
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
    const manager = getManager();
    const userRepository = getCustomRepository(AccountRepository);

    const repository = getCustomRepository(OldAccountsRepository);
    const oldUsers = await repository.index();

    // Configuração de prox
    const execPHP = promisify(phpRunner.exec);
    const ipProxy = await execPHP('php script.php addIpv6,1');
    const proxy = JSON.parse(ipProxy);
    let count = 0;

    for await (const user of oldUsers) {
      logger.info(`${user.username}:${user.password}`);

      const currentProxy = proxy[count++].port;
      const response = await create(user, currentProxy);

      if (!response.success) {
        const query = await makeQuery(response);
        console.log(query);
        console.log(response.status);
        //   await manager.query(query);

        //   logData(`
        // ${user.username}:${user.password}
        // ${response}
        //         `);
      }

      if (response.fbid) {
        const { id, fbid, full_name, profile_pic_url_hd, username } = response;

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

      console.log('CHEGA AQUI COMO DEVE');
      await execPHP(`php script.php rmIpv6,${proxy.ip}`);

      throw new Error('teste');
    }

    // Finalizar prox
    await execPHP('php script.php restartSquid');
  }
}
