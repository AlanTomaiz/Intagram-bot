import { EntityRepository, Repository } from 'typeorm';

import Account from '../entities/Account';

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {
  async getById(_id: string) {
    return this.findOne({ where: { instaid: _id } });
  }
}
