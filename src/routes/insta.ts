import { Router } from 'express';

import ActionsRoutes from './actions';
import SessionRoutes from './session';
import ensureAuthenticated from '../middleware/authenticated';

const InstaRoutes = Router();

InstaRoutes.use(SessionRoutes);
// InstaRoutes.use('/actions', ensureAuthenticated, ActionsRoutes);

export default InstaRoutes;
