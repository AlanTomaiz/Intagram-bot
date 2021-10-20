import { Router } from 'express';

import HandleLogin from '../services/HandleLogin';
import HandleCookies from '../services/HandleCookies';
import HandleRelogin from '../services/HandleRelogin';

const InstaRoutes = Router();

InstaRoutes.get('/relogin/cookies/', async (request, response) => {
  const serviceCookies = new HandleCookies();
  await serviceCookies.run();

  return response.send();
});

InstaRoutes.get('/relogin/', async (request, response) => {
  const serviceRelogin = new HandleRelogin();
  serviceRelogin.run();

  return response.send({
    status: 'success',
    message: 'Relogin iniciado com sucesso!',
  });
});

InstaRoutes.post('/login', async (request, response) => {
  const { username, password } = request.body;

  const service = new HandleLogin();
  await service.run({ user: username, pass: password });

  return response.send();
});

export default InstaRoutes;
