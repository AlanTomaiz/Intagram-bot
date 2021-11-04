import { getCustomRepository } from 'typeorm';

import AppError from '../errors/app-error';
import AccountRepository from '../repositories/AccountRepository';

interface Request {
  user_id: string;
  socket_id: string;
}

export default class HandleFollows {
  async execute({ user_id, socket_id }: Request) {
    const repository = getCustomRepository(AccountRepository);

    const user = await repository.getById(user_id);
    if (!user) {
      throw new AppError(
        'Não foi possível localizar este usuário, tente novamente.',
      );
    }

    console.log(user);
  }
}
