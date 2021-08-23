import { Router } from 'express';

import RequestError from '../errors/request-error';
import HandleLogin from '../services/HandleLogin';

const InstaRoutes = Router();

InstaRoutes.post('/relogin/:SECRET', async (request, response) => {
  const { SECRET } = request.params;

  if (SECRET !== process.env.APP_SECRET) {
    throw new RequestError(
      'Você não tem permissão para executar esta operação.',
    );
  }

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
