import 'reflect-metadata';
import { getLocationsFromExcel } from '@/helpers/excel';
import { initializeStore } from '../db/index';
import { User, MaxlineUser } from '../schema/types/user';
import { getValidUsername, Roles, getShortUuid } from '@/helpers/utils';
import { Address } from '@/types/address';
const shortid = require('shortid');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import dotenv from 'dotenv';
import uuid = require('uuid');

dotenv.config();

(async () => {
  try {
    console.log('Creating MIB users...');
    const store = await initializeStore();
    const session = store.openSession();

    const sheetName = 'Sheet1';
    const documentName = 'yep-sponsors-export-member-Aug-12-2019.csv';
    const exportCSV = 'MIBAccounts.csv';

    const users = await getLocationsFromExcel(sheetName, documentName);
    const newMaxlineUsers: User[] = [];
    const records: any = [];

    for (const customer of users) {
      const maxlineId = customer['Id'];
      const address1: string = customer['Address 1'];
      const address2: string = customer['Address 2'];
      const address = address1.concat(' ', address2);
      const city = customer['City'];
      const state = customer['State/Province'];
      const maxlineEnrollerId = customer['Enroller Id'];
      const zip = customer['ZIP/Postal Code'];

      const userName = customer['Username'];
      const firstName = customer['First Name'];
      const lastName = customer['Last Name'];

      const companyName = customer['CompanyName'];
      const email = customer['Email'];
      const phoneNumber = customer['Phone Number'];
      const created = customer['Created'];

      let user: User = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('email', email)
        .firstOrNull();

      if (!user) {
        let username = `${firstName.trim()}${lastName.trim()}`.replace(/\s/g, '').toLowerCase();
        username = await getValidUsername(session, username);
        user = new User(
          getShortUuid(),
          firstName,
          lastName,
          username,
          email,
          null,
          false,
          [],
          [],
          null,
          true,
          phoneNumber,
          [Roles.Affiliate, Roles.YEP, Roles.Maxline],
          [],
          null,
          new Address(address, city, state, zip, 'United States')
        );
        user.maxlineUser = new MaxlineUser(getShortUuid(), null, null, null, null, maxlineId, maxlineEnrollerId);
        user.password = user.maxlineUser.yepId;
        await session.store(user);
        newMaxlineUsers.push(user);
      } else {
        user.maxlineUser = new MaxlineUser(getShortUuid(), null, null, null, null, maxlineId, maxlineEnrollerId);
        user.roles = [...user.roles, Roles.Maxline, Roles.YEP];
        await session.saveChanges();
      }

      records.push({
        Id: maxlineId,
        yepid: user.maxlineUser.yepId,
        address1,
        address2,
        city,
        state,
        enrollerId: maxlineEnrollerId,
        zipCode: zip,
        userName,
        firstName,
        lastName,
        companyName,
        email,
        phoneNumber,
        created,
      });
    }

    console.log('newMaxlineUsers', newMaxlineUsers.length);
    const tryBulkMaxlineUsers = store.bulkInsert();
    for (const user of newMaxlineUsers) {
      console.log('user.id', user.id);
      await tryBulkMaxlineUsers.store(user, user.id);
    }
    await tryBulkMaxlineUsers.finish();

    const csvWriter = createCsvWriter({
      path: exportCSV,
      header: [
        { id: 'Id', title: 'Id' },
        { id: 'yepid', title: 'YEP ID Number' },
        { id: 'address1', title: 'Address 1' },
        { id: 'address2', title: 'Address 2' },
        { id: 'city', title: 'City' },
        { id: 'state', title: 'State/Province' },
        { id: 'enrollerId', title: 'Enroller Id' },
        { id: 'zipCode', title: 'Zip/Postal Code' },
        { id: 'userName', title: 'Username' },
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'companyName', title: 'CompanyName' },
        { id: 'email', title: 'Email' },
        { id: 'phoneNumber', title: 'Phone Number' },
        { id: 'created', title: 'Created' },
      ],
    });
    await csvWriter
      .writeRecords(records) // returns a promise
      .then(() => {
        console.log('...Done');
      });

    console.log('MIB accounts applet ended...');
    process.exit(0);
  } catch (ex) {
    console.log(ex.message);
    process.exit(1);
  }
})();
