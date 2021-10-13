import { EntityRepository, Repository } from 'typeorm';

import Account from '../entities/Account';
import OldAccounts from '../entities/OldAccount';

@EntityRepository(OldAccounts)
export default class OldAccountsRepository extends Repository<OldAccounts> {
  async index(): Promise<OldAccounts[]> {
    const query = this.createQueryBuilder('old');

    query.select('old');
    query.leftJoin(Account, 'account', 'old.username = account.account_user');
    query.where('old.status < 3');
    query.andWhere('account.account_user IS NULL');
    query.orderBy('rand()');
    query.limit(100);

    const result = await query.getMany();
    return result;
  }
}
