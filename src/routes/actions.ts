import { Router } from 'express';

import HandleFollows from '../services/HandleFollows.service';

const ActionsRoutes = Router();

ActionsRoutes.get('/followers/', async (request, response) => {
  const { id, wss } = request.user;

  const serviceFollow = new HandleFollows();
  await serviceFollow.execute({ user_id: id, socket_id: wss });

  return response.json({ status: 'success' });
});

export default ActionsRoutes;
