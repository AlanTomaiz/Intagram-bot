import { EntityRepository, Repository } from 'typeorm';
import Account from '../entities/Account';

import OldAccounts from '../entities/OldAccount';

@EntityRepository(OldAccounts)
export default class OldAccountsRepository extends Repository<OldAccounts> {
  async index(): Promise<OldAccounts[]> {
    const query = this.createQueryBuilder('old');

    query.select('old');
    query.innerJoin(Account, 'account', 'old.username != account.account_user');
    query.limit(20);

    const result = await query.getMany();
    return result;
  }
}
