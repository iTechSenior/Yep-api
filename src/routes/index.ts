import { Application, Router } from 'express';

import certificate from './certificates';
import yep from './yep';
import aws from './aws';
import paypal from './paypal';
import stripe from './stripe';

module.exports = (app: Application) => {
  app.use(aws);

  const routePrefix = '/api';
  const router = Router();

  router.use(certificate);
  router.use(yep);
  router.use(paypal);
  router.use(stripe);

  app.use(routePrefix, router);
};
