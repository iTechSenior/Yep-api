import { Router, Response } from 'express';
import { CustomRequest } from '../helpers/interfaces';

const router = Router();

router.get('/ping', async (req: CustomRequest, res: Response) => {
  // const session = req.db.openSession();
  // const healthCheck = new HealthCheck(null, null, { headers: req.headers, body: req.body });
  // await session.store(healthCheck);
  // await session.saveChanges();
  res.status(200).send('pong');
});

export default router;
