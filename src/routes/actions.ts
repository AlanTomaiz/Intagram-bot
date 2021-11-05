import { Router } from 'express';

import HandleFollows from '../services/HandleFollows.service';

const ActionsRoutes = Router();

ActionsRoutes.get('/followers/', async (request, response) => {
  const { wss } = request.user;

  const serviceFollow = new HandleFollows();
  await serviceFollow.execute(wss);

  return response.json({ status: 'success' });
});

export default ActionsRoutes;
