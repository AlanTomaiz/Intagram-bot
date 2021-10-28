import 'reflect-metadata';
import 'dotenv/config';

import express from 'express';
import 'express-async-errors';
import './database';

import HandleError from './middleware/response.error';
import InstaRoutes from './routes/insta';

const app = express();
const PORT = 3333;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (request, response) => {
  return response.send({ message: 'Hello World' });
});

app.use(InstaRoutes);
app.use(HandleError);

app.listen(PORT, () => console.log(`# Server start on port: ${PORT}`));
