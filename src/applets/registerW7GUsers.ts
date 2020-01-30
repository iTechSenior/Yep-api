import 'reflect-metadata';
import { getLocationsFromExcel } from '@/helpers/excel';
import { initializeStore } from '../db/index';
import { User } from '../schema/types/user';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import dotenv from 'dotenv';
import { W7GUser } from '@/types/user/W7GUser';
import { W7GEndpoints, w7gRegisterAndPayUser } from '@/helpers/w7gomc';
const axios = require('axios');

dotenv.config();

(async () => {
  try {
    console.log('Updating W7G Users...');
    const store = await initializeStore();
    const session = store.openSession();

    const sheetName = 'Sheet1';
    const documentName = 'W7GData.csv';
    const exportCSV = 'MissingUsers.csv';

    const users = await getLocationsFromExcel(sheetName, documentName);

    for (const customer of users) {
      const email: string = customer['Email'];
      console.log(email);
      const user: User = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('email', email)
        .firstOrNull();

      const sponsor: User = await session.load<User>(user.sponsor.id);
      if (user && sponsor) {
        await w7gRegisterAndPayUser(user, sponsor, session);
      }
    }

    console.log('The end...');
    process.exit(0);
  } catch (ex) {
    console.log(ex.message);
    process.exit(1);
  }
})();
