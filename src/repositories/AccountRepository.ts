import { EntityRepository, Repository } from 'typeorm';

import Account from '../entities/Account';

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {
  async getById(_id: string) {
    return this.findOne({ where: { instaid: _id } });
  }

  async getRandomUser(NOT_USER?: string) {
    const query = this.createQueryBuilder();
    const time = new Date().getTime();

    query.where('status = 1');
    query.andWhere(`next_use > ${time}`);
    query.orderBy('rand()');

    if (NOT_USER) {
      query.andWhere('account_user != :NOT_USER', { NOT_USER });
    }

    const result = await query.getOne();
    return result;
  }
}
