import express from 'express';

import HandlePage from './services/HandlePage';

const app = express();
const PORT = 3333;

app.get('/', (request, response) => {
  return response.send({ message: 'Hello World' });
});

app.post('/login', async (request, response) => {
  const { username, password } = request.body;

  const service = new HandlePage();
  await service.run({ user: username, pass: password });

  return response.send({ message: 'Hello World' });
});

app.listen(PORT, () => console.log(`# Server start on port: ${PORT}`));
