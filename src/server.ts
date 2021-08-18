import express from 'express';
import 'express-async-errors';

import HandleError from './middleware/response.error';
import HandleLogin from './services/HandleLogin';

const app = express();
const PORT = 3333;

app.use(express.json());

app.get('/', (request, response) => {
  return response.send({ message: 'Hello World' });
});

app.post('/login', async (request, response) => {
  const { username, password } = request.body;

  const service = new HandleLogin();
  await service.run({ user: username, pass: password });

  return response.send({ message: 'Hello World' });
});

app.use(HandleError);

app.listen(PORT, () => console.log(`# Server start on port: ${PORT}`));
