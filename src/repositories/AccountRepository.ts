import { EntityRepository, Repository } from 'typeorm';

import Account from '../entities/Account';

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {}
