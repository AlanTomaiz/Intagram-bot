import { getCustomRepository } from 'typeorm';

import AccountRepository from '../repositories/AccountRepository';
import OldAccountsRepository from '../repositories/OldAccountRepository';

export default class HandleRelogin {
  async run(): Promise<any[]> {
    const repository = getCustomRepository(OldAccountsRepository);

    const oldUsers = await repository.index();
    return oldUsers;
  }
}
