import { Request, Response, NextFunction } from 'express';

import AppError from '../errors/app-error';
import RequestError from '../errors/request-error';

const HandleError = (
  err: Error,
  req: Request,
  res: Response,
  _: NextFunction,
) => {
  console.log('ERROR', err.message || err);

  if (err instanceof RequestError) {
    const message =
      err.message || 'Erro ao executar esta operação, tente novamente.';

    return res.status(err.statusCode).json(message);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.data);
  }

  return res
    .status(500)
    .json({ status: 'error', message: 'Internal server error' });
};

export default HandleError;
