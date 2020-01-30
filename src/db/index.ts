import { IDocumentStore, DocumentStore } from 'ravendb';
import * as fs from 'fs';
import * as path from 'path';
import { Migrations as AppSettingMigrations, Migrations } from '@/types/appSettings/Migrations';
import migrations from './migrations';
// import Migrations from './migrations';
import moment = require('moment');
import { some } from 'lodash';
import { getAppSettings } from '../../src/helpers/utils';
import { DateTime } from 'luxon';
import { AppSettings } from '@/types/appSettings';
import models from '@/types/index';

export const initializeStore = async (): Promise<IDocumentStore> => {
  const { DATABASE_NAME, DATABASE_URL, PFX_SECRET_KEY, PFX_NAME } = process.env;
  let store: IDocumentStore;
  if (DATABASE_URL.indexOf('localhost') < 0) {
    const certificate = path.resolve(`./${PFX_NAME}`);

    console.log(`Certificate: ${PFX_NAME}`);
    console.log(`DatabaseUrl: ${DATABASE_URL}`);
    console.log(`DatabaseName: ${DATABASE_NAME}`);

    store = new DocumentStore(DATABASE_URL, DATABASE_NAME, {
      certificate: fs.readFileSync(certificate),
      type: 'pfx',
      password: PFX_SECRET_KEY,
    });
  } else {
    console.log(`Running RavenDB via localhost...`);
    console.log(`DatabaseUrl: ${DATABASE_URL}`);
    console.log(`DatabaseName: ${DATABASE_NAME}`);
    store = new DocumentStore(DATABASE_URL, DATABASE_NAME);
  }

  store.conventions.registerEntityType(models.AppSettings);
  store.conventions.registerEntityType(models.Certificate);
  store.conventions.registerEntityType(models.ClickFunnelPurchase);
  // store.conventions.registerEntityType(models.Conversion);
  store.conventions.registerEntityType(models.DumpBucket);
  store.conventions.registerEntityType(models.Exception);
  // store.conventions.registerEntityType(models.FrequentlyAskedQuestion);
  store.conventions.registerEntityType(models.Prospect);
  // store.conventions.registerEntityType(models.Reservation);
  // store.conventions.registerEntityType(models.ReservationDeposit);
  // store.conventions.registerEntityType(models.Trip);
  // store.conventions.registerEntityType(models.User);
  store.conventions.registerEntityType(models.UserSubscription);
  // store.conventions.registerEntityType(models.Video);

  // store.conventions.registerEntityType(models.Product);
  store.conventions.registerEntityType(models.Funnel);
  store.conventions.registerEntityType(models.Lead);
  store.conventions.registerEntityType(models.LeadVisit);
  // store.conventions.registerEntityType(models.Order);
  store.conventions.registerEntityType(models.Contact);
  store.conventions.registerEntityType(models.ContactEmail);

  // store.conventions.registerEntityType(models.MaxlineTransfer);
  store.conventions.registerEntityType(models.Event);

  store.conventions.storeDatesInUtc = true;
  store.conventions.maxNumberOfRequestsPerSession = 25000;
  console.log('about to initialize');

  store.initialize();
  await migrate(store);
  console.log('Done with Migrations');

  return store;
};

export const migrate = async (store: IDocumentStore): Promise<void> => {
  console.log(`Checking For Migrations`);
  const session = store.openSession();
  const appSettings = await getAppSettings<AppSettings>(session, '1-A');
  if (appSettings) {
    if (!appSettings.migrations) appSettings.migrations = [];
    for (const migration of Object.keys(migrations)) {
      try {
        const alreadyExecuted = some(appSettings.migrations, { migration });
        if (!alreadyExecuted) {
          console.log(`Executing Migration: ${migration}`);
          await migrations[migration].up(store);
          appSettings.migrations.push({ executedOn: moment().toDate(), migration });
        }
      } catch (ex) {
        console.log(`Executing Migration: ${migration} Error > ${ex.message}`);
        await migrations[migration].down(store);
      }
    }
    await session.saveChanges();
  }
};
