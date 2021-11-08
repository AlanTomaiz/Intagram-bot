/* eslint no-plusplus: "off" */
import { getCustomRepository } from 'typeorm';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';
import { getRandomPort } from '../utils/handlePorts';
import { wss } from '../server';

import AppError from '../errors/app-error';
import AccountRepository from '../repositories/AccountRepository';

interface Request {
  user_id: string;
  socket_id: string;
}

export default class HandleFollows {
  async execute({ user_id, socket_id }: Request) {
    const repository = getCustomRepository(AccountRepository);

    const findUser = await repository.getById(user_id);
    if (!findUser) {
      throw new AppError(
        `Não foi possivel localizar este usuário, tente novamente.`,
      );
    }

    const { total_ref, account_user: userToFollow } = findUser;

    let follows = 0;
    const lastMessage = new Date().getTime() - 1000;
    const totalFollows = total_ref + 10;

    (async function loop() {
      if (follows <= totalFollows) {
        const user = await repository.getRandomUser(user_id);

        // @ts-expect-error Sempre retorna um usuário por ser radom
        const { account_user: username, account_pass: password } = user;
        const credentials = { username, password };

        try {
          const port = await getRandomPort();
          const { browser, page } = await create({
            username,
            proxy_port: port,
          });

          const client = new Instagram({ browser, page, credentials });
          await client.follow(userToFollow);

          follows++;

          if (lastMessage < new Date().getTime()) {
            wss.to(socket_id).emit('new_follow', follows);
          }
        } catch (err) {
          const error_message =
            err.data?.message || err.data || err.message || err;

          console.log('Error on loop:', error_message);
        }

        loop();
      }
    })();
  }
}
