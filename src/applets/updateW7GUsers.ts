import 'reflect-metadata';
import { getLocationsFromExcel } from '@/helpers/excel';
import { initializeStore } from '../db/index';
import { User } from '../schema/types/user';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import dotenv from 'dotenv';
import { W7GUser } from '@/types/user/W7GUser';
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
    const missingYEP: any = [];
    const missingW7G: any = [];
    let token: string = '';
    let url = 'https://wondersevenglobal.net/app/v1.0/index.php/auth/';
    // let url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getToken : W7GEndpoints.production.getToken;
    // let url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/';
    let response = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        auth_user: process.env.W7G_AUTH_USER,
        auth_pass: process.env.W7G_AUTH_PASS,
      },
    });
    if (response.status === 200) {
      if (response.data.STATUS === 'FAIL') {
        console.log('Token error: ');
        process.exit(1);
      }
      token = response.data.access_token;
      console.log('w7gGetToken =', token);
      console.log(JSON.stringify(response.data, null, 1));
    }

    for (const customer of users) {
      const email: string = customer['Member Email Address'];
      const name: string = customer['Member Name'];
      const mem_pass: string = customer['Password'];
      const mem_id: string = customer['Member ID'];

      const user: User = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('email', email)
        .orElse()
        .whereEquals('maxlineId', mem_id)
        .firstOrNull();

      if (!user) {
        console.log('No such user in YEP: ', name, '(', email, ')');
        missingYEP.push({
          name: name,
          email: email,
        });
      } else {
        url = 'https://wondersevenglobal.net/app/v1.0/index.php/member/info/';
        response = await axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: {
            email: email.toLowerCase(), // Email
          },
        });
        if (response.status === 200) {
          if (response.data.STATUS_CODE === 0) {
            const { mem_id, email, name_t, sp_code, upa_code, side } = response.data.DATA;
            if (user.w7gUser) {
              user.w7gUser.memberId = mem_id;
              user.w7gUser.mem_pass = mem_pass;
              user.w7gUser.spCode = sp_code;
              user.w7gUser.upaCode = upa_code;
            } else {
              user.w7gUser = new W7GUser(mem_id, upa_code, sp_code);
              user.w7gUser.mem_pass = mem_pass;
            }
            await session.saveChanges();
          } else {
            console.log('email', email);
            console.log(JSON.stringify(response.data, null, 1));
            // console.log(`Can't find user on W7G:`, name, '(', email, ')');
            missingW7G.push({
              name: name,
              email: email,
            });
          }
        }
      }
    }

    // const csvWriter = createCsvWriter({
    //   path: exportCSV,
    //   header: [
    //     { id: 'name', title: 'Name' },
    //     { id: 'email', title: 'Email' },
    //   ],
    // });
    // await csvWriter
    //   .writeRecords(missingYEP) // returns a promise
    //   .then(() => {
    //     console.log('...Done');
    //   });

    console.log('Missing YEP:', missingYEP);
    console.log('Missing W7G:', missingW7G);
    console.log('The end...');
    process.exit(0);
  } catch (ex) {
    console.log(ex.message);
    process.exit(1);
  }
})();
