import { Router } from 'express';

import HandleLogin from '../services/HandleLogin';
import HandleRelogin from '../services/HandleRelogin';

const InstaRoutes = Router();

InstaRoutes.get('/relogin/', async (request, response) => {
  const serviceRelogin = new HandleRelogin();
  await serviceRelogin.run();

  return response.send({
    status: 'success',
    message: 'Relogin realizado com sucesso!',
  });
});

InstaRoutes.post('/login', async (request, response) => {
  const { username, password } = request.body;

  const service = new HandleLogin();
  await service.run({ user: username, pass: password });

  return response.send();
});

export default InstaRoutes;
