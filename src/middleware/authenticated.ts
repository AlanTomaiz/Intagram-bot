import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import AppError from '../errors/app-error';
import authConfig from '../config/auth';

interface ITokenPayload {
  iat: number;
  exp: number;
  sub: string;
}

const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const wssID = String(req.headers.wss);

  if (!authHeader || !wssID) {
    throw new AppError('JWT is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, authConfig.secret);
    const { sub } = decoded as ITokenPayload;

    req.user = {
      id: sub,
      wss: wssID,
    };
    return next();
  } catch {
    throw new AppError('Invalid JWT token', 401);
  }
};

export default ensureAuthenticated;
