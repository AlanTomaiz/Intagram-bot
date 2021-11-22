/* eslint no-plusplus: "off" */
import { getCustomRepository, getManager } from 'typeorm';

import Instagram from '../api/instagram';
import { create } from '../controllers/initializer';
import { logger } from '../utils/logger';
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
    const manager = getManager();
    const repository = getCustomRepository(AccountRepository);
    const today = new Date();

    const findUser = await repository.getById(user_id);
    if (!findUser) {
      throw new AppError(
        `Não foi possivel localizar este usuário, tente novamente.`,
      );
    }

    const { total_ref, account_user: userToFollow, block_following } = findUser;

    const block_time = today.getTime();
    if (block_time <= block_following) {
      wss.to(socket_id).emit('block_following');

      throw new AppError(
        `Você deve aguardar 30min antes de solicitar novos seguidores.`,
      );
    }

    await repository.save({
      _id: findUser._id,
      block_following: block_time + 60000 * 30,
      updated_at: new Date(),
    });

    let follows = 0;
    const totalFollows = total_ref + 10;

    (async function loop() {
      if (follows < totalFollows) {
        console.log('');
        logger.info('Start Follow action...');

        const user = await repository.getRandomUser(user_id);

        if (!user) {
          logger.info('User not found!!!');
          wss.to(socket_id).emit('block_follow');
          return;
        }

        const { _id, account_user: username, account_pass: password } = user;
        const credentials = { username, password };

        const nextUseTime = today.getTime() + 60000 * 5;
        const updateUser = {
          _id,
          next_use: nextUseTime,
          updated_at: new Date(),
        };

        await repository.save({ ...updateUser });

        try {
          const port = await getRandomPort();
          const { browser, page } = await create({
            username,
            proxy_port: port,
          });

          const client = new Instagram({ browser, page, credentials });
          await client.follow(userToFollow);

          follows++;
          wss.to(socket_id).emit('new_follow', follows);

          // Block future re-follow
          await manager.query(`INSERT INTO follow_ref(follow, userid)
          VALUES (${user_id}, ${user.instaid});`);

          logger.info('New follow...');
        } catch (err: any) {
          const error_message =
            err.data?.message || err.data || err.message || err;

          if (error_message === 'block') {
            const nextTime = new Date();
            nextTime.setDate(today.getDate() + 8);

            const update = {
              _id,
              next_use: nextTime.getTime(),
              updated_at: new Date(),
            };

            await repository.save({ ...update });
          }

          if (error_message === 'FOLLOWER') {
            await manager.query(`INSERT INTO follow_ref(follow, userid)
            VALUES (${user_id}, ${user.instaid});`);
          }

          if (
            error_message === 'DISCONNECTED' ||
            error_message === 'CHECKPOINT'
          ) {
            const update = {
              _id,
              status: 3,
              updated_at: new Date(),
            };

            await repository.save({ ...update });
          }

          logger.info(`Error on loop: ${error_message}`);
        }

        loop();
      }
    })();
  }
}
