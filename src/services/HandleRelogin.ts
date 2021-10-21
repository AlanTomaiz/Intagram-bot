/* eslint no-plusplus: "off", no-continue: "off" */
import { getCustomRepository, getManager } from 'typeorm';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';
import { logger } from '../utils/logger';
import { logData } from '../utils/handleFiles';
import { makeQuery } from '../controllers/mysql';
import { getRandomPort } from '../utils/handlePorts';

export default class HandleRelogin {
  async run(): Promise<void> {
    logger.info('Start proccess relogin.');

    await this.only();
    // await this.queue();

    logger.info('Relogin finalizado.');
  }

  async queue(): Promise<void> {
    const manager = getManager();

    const userRepository = getCustomRepository(AccountRepository);
    const repository = getCustomRepository(OldAccountsRepository);
    const oldUsers = await repository.index();

    for await (const user of oldUsers) {
      const { browser, page } = await create({
        username: user.username,
        // proxy_port: currentProxy.port,
      }).catch(() => {
        return { browser: null, page: null };
      });

      if (!browser || !page) {
        logger.error(`Error open browser.`);
        continue;
      }

      const client = new Instagram({ browser, page, credentials: user });
      const { status, data, message, type } = await client.startLogin();

      // Usuário logado
      if (status === 'success') {
        logger.info(`${user.username}:${user.password} - SUCCESS`);

        // await manager.query(
        //   'UPDATE metrics SET attempts = attempts + 1, connected = connected + 1 WHERE metric_id = 2;',
        // );

        // const { id, fbid, profile_pic_url_hd, username } = data;

        // const newUser = {
        //   fbid,
        //   instaid: id,
        //   avatar: profile_pic_url_hd,
        //   account_user: user.username,
        //   account_pass: user.password,
        //   username,
        // };

        // const saveData = userRepository.create(newUser);
        // await userRepository.save(saveData);
      }

      // Checkpoint
      if (status === 'checkpoint') {
        logger.error(`${user.username}:${user.password} - ${type}`);

        // let query = makeQuery(String(type));
        // await manager.query(query);

        // // Update usuarios table
        // query = `UPDATE usuarios SET status = 3 WHERE id = ${user.id};`;

        // // Checkpoint
        // if (type === 'CHECKPOINT') {
        //   query = `UPDATE usuarios SET status = 5 WHERE id = ${user.id};`;
        // }

        // await manager.query(query);
      }

      // Error
      if (status === 'error') {
        logger.error(`${user.username}:${user.password}`);
        logger.error(message);
      }

      // await client.close();
      // await execPHP(`php script.php rmIpv6,${currentProxy.ip}`);
      logData(`${user.username}:${user.password}\r\n${message}`);
      console.log('');
    }

    // await execPHP('php script.php restartSquid');
  }

  async only() {
    const port = await getRandomPort();
  }
}
