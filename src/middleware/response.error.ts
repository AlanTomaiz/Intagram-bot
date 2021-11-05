import { Request, Response, NextFunction } from 'express';

import AppError from '../errors/app-error';
import RequestError from '../errors/request-error';

import { logger } from '../utils/logger';

const HandleError = (
  err: Error,
  req: Request,
  res: Response,
  _: NextFunction,
) => {
  console.log(err);
  // @ts-expect-error Error de type
  const error_message = err.data?.message || err.message || err;
  logger.error(`Process error: ${error_message}`);

  if (err instanceof RequestError) {
    const message =
      err.message || 'Erro ao executar esta operação, tente novamente.';

    return res.status(err.statusCode).json({ status: 'error', message });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.data);
  }

  return res
    .status(500)
    .json({ status: 'error', message: 'Internal server error' });
};

export default HandleError;
