import { EntityRepository, Repository } from 'typeorm';

import Account from '../entities/Account';

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {
  async getById(_id: string) {
    return this.findOne({ where: { instaid: _id } });
  }

  async getRandomUser(NOT_USER?: string) {
    const query = this.createQueryBuilder('ACCOUNT');
    const time = new Date().getTime();

    query.where('ACCOUNT.status = 1');
    query.andWhere(`(ACCOUNT.next_use < ${time} || ACCOUNT.next_use IS NULL)`);

    if (NOT_USER) {
      query.andWhere(`ACCOUNT.instaid != ${NOT_USER}`);
    }

    query.leftJoin(
      'follow_ref',
      'REF',
      `REF.userid = ACCOUNT.instaid AND REF.follow = ${NOT_USER}`,
    );

    query.andWhere('REF.userid IS NULL');
    query.limit(1);

    // query.orderBy('rand()');

    const result = await query.getOne();
    return result;
  }
}
