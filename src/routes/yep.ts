import * as express from 'express';
import { CustomRequest } from '../helpers/interfaces';
import shortid from 'shortid';
import { MaxlineUser, User, MaxlineTransfer } from '@/types/user';
import moment = require('moment');
import { getValidUsername, isUsernameTaken, isUsernameTakenByEmail, getShortUuid } from '@/helpers/utils';
import { NextIdentityForCommand, SeedIdentityForCommand } from 'ravendb';
import { DumpBucket } from '@/types/dumpBucket';

const router = express.Router();

router.get('/yep/id', async (req: CustomRequest, res: express.Response) => {
  res.status(200).send({ id: getShortUuid() });
});

router.post('/yep/transfer', async (req: CustomRequest, res: express.Response) => {
  const { username, email, id, enrollerId } = req.body;
  const session = req.db.openSession();

  const sponsor = await session
    .query<User>({ indexName: 'Users' })
    .whereEquals('maxlineId', enrollerId)
    .firstOrNull();

  const user = await session
    .query<User>({ indexName: 'Users' })
    .whereEquals('maxlineId', id)
    .orElse()
    .whereEquals('email', email)
    .firstOrNull();

  let maxlineTransfer = await session
    .query<MaxlineTransfer>({ indexName: 'MaxlineTransfers' })
    .whereEquals('maxlineId', id)
    .firstOrNull();

  if (await isUsernameTaken(session, user ? user.id : null, username)) {
    res.status(400).send({ message: 'Username Not Available.' });
    res.end();
  } else {
    if (maxlineTransfer) {
      maxlineTransfer.email = email;
      maxlineTransfer.username = username;
      maxlineTransfer.userId = user ? user.id : null;
      maxlineTransfer.sponsorId = sponsor ? sponsor.id : null;
    } else {
      let nextIdentityCommand = new NextIdentityForCommand('YEP-ID');
      await req.db.getRequestExecutor().execute(nextIdentityCommand);
      const yepId = `YEP-${nextIdentityCommand.result.toString().padStart(10, '0')}`;

      nextIdentityCommand = new NextIdentityForCommand(`YEP-Token-${moment().format('DD')}`);
      await req.db.getRequestExecutor().execute(nextIdentityCommand);
      const token = `${moment().format('YYYYMMDD')}${nextIdentityCommand.result.toString().padStart(5, '0')}`;

      try {
        if (nextIdentityCommand.result === 1) {
          const seedIdentityCommand = new SeedIdentityForCommand(
            `YEP-Token-${moment()
              .add(-1, 'days')
              .format('DD')}`,
            0,
            true
          );
          await req.db.getRequestExecutor().execute(seedIdentityCommand);
        }
      } catch (ex) {
        const err = new DumpBucket(null, '/yep/transfer > SeedIdentityForCommand', {
          token,
          seedIdentity: `YEP-Token-${moment()
            .add(-1, 'days')
            .format('DD')}`,
        });
        await session.store(err);
        await session.saveChanges();
      }

      maxlineTransfer = new MaxlineTransfer(username, email, token, yepId, user ? user.id : null, sponsor ? sponsor.id : null, id, enrollerId);
      await session.store(maxlineTransfer);
    }

    const metadata = session.advanced.getMetadataFor(maxlineTransfer);
    const expiration = moment().add(1, 'hour');
    metadata['@expires'] = expiration.toISOString();

    await session.saveChanges();
    res.status(200).send({ id: maxlineTransfer.token, exp: expiration.unix() });
    res.end();
  }
});

router.post('/yep/sync', async (req: CustomRequest, res: express.Response) => {
  const { username, email, id } = req.body;
  const session = req.db.openSession();

  const user = await session
    .query<User>({ indexName: 'Users' })
    .whereEquals('maxlineId', id)
    .firstOrNull();

  if (user) {
    if (await isUsernameTaken(session, user.id, username)) {
      res.status(400).send({ message: 'Username Not Available.' });
      res.end();
    } else {
      user.email = email;
      user.username = username;

      await session.saveChanges();
      res.status(200).send({ id, username, email, yepId: user.maxlineUser!.yepId });
      res.end();
    }
  } else {
    res.status(404).send({ message: 'User Not Found.' });
    res.end();
  }
});

router.get('/yep/check/username/:username', async (req: CustomRequest, res: express.Response) => {
  const session = req.db.openSession();
  res.status(200).send({
    available: !(await session
      .query<User>({ indexName: 'Users' })
      .whereEquals('username', req.params.username)
      .any()),
  });
  res.end();
});

export default router;
