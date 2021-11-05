import { getCustomRepository } from 'typeorm';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';
import { getRandomPort } from '../utils/handlePorts';

import AppError from '../errors/app-error';
import AccountRepository from '../repositories/AccountRepository';

interface Request {
  socket_id: string;
}

export default class HandleFollows {
  async execute(socket_id: string) {
    const repository = getCustomRepository(AccountRepository);
  }
}
