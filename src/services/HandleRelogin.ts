import { getCustomRepository, getManager } from 'typeorm';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

import { create } from '../controllers/initializer';
import { makeQuery } from '../controllers/mysql';
import { TestConnection } from '../controllers/connection';
import { logger } from '../utils/logger';

export default class HandleRelogin {
  async run(): Promise<void> {
    await TestConnection();

    logger.info('Start proccess relogin.');
    // this.start();
  }

  async start(): Promise<void> {
    const manager = getManager();
    const userRepository = getCustomRepository(AccountRepository);

    const repository = getCustomRepository(OldAccountsRepository);
    const oldUsers = await repository.index();

    for await (const user of oldUsers) {
      const response = await create(user);

      if (!response.success) {
        const query = await makeQuery(response);
        await manager.query(query);
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
    }
  }
}
