import { Router } from 'express';

import HandleLogin from '../services/HandleLogin';
import HandleRelogin from '../services/HandleRelogin';
import HandleCheckpoint from '../services/HandleCheckpoint';

const SessionRoutes = Router();

SessionRoutes.get('/relogin/', async (request, response) => {
  const service = new HandleRelogin();
  service.run();

  return response.json({ status: 'success' });
});

SessionRoutes.post('/login/', async (request, response) => {
  const { username, password } = request.body;

  const service = new HandleLogin();
  const { user, token } = await service.run({ username, password });

  return response.json({ status: 'success', user, token });
});

SessionRoutes.post('/checkpoint/', async (request, response) => {
  const { username, password, code } = request.body;

  const service = new HandleCheckpoint();
  const { user, token } = await service.run({ username, password, code });

  return response.json({ status: 'success', user, token });
});

export default SessionRoutes;
