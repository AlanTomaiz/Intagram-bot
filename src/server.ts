/* eslint no-param-reassign: "off" */
import 'reflect-metadata';
import 'dotenv/config';

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import 'express-async-errors';
import './database';

import { logger } from './utils/logger';
import HandleError from './middleware/response.error';
import InstaRoutes from './routes/insta';
import { generatePorts } from './utils/handlePorts';

const app = express();
const PORT = 3333;

const server = createServer(app);
const wss = new Server(server, {
  cors: {
    origin: '*',
    credentials: false,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (request, response) => {
  return response.send({ message: 'Hello World' });
});

app.use(InstaRoutes);
app.use(HandleError);

wss.on('connection', (socket: any) => {
  logger.info(`Someone connected on ws: ${socket.id}`);
});

async function init() {
  logger.info('Starting server...');
  await generatePorts();

  setTimeout(async () => {
    logger.info('Squid reloading...');
    await generatePorts();
  }, 60000 * 60 * 3);

  server.listen(PORT, () => logger.info(`# Server start on port: ${PORT}`));
}

init();
export { wss };
