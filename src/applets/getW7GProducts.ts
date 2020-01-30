import 'reflect-metadata';
import { W7GEndpoints } from '@/helpers/w7gomc';
import dotenv from 'dotenv';
import { YepProduct } from '@/types/product';
import { initializeStore } from '../db/index';
const axios = require('axios');
dotenv.config();

(async () => {
  try {
    console.log('Creating W7G Products...');

    const store = await initializeStore();
    const session = store.openSession();

    console.log('process.env.NODE_ENV', process.env.NODE_ENV);

    let token: string = '';
    let url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getToken : W7GEndpoints.production.getToken;
    console.log('url', url);
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

    url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getProductInfo : W7GEndpoints.production.getProductInfo;
    console.log('url', url);
    response = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: { locationbase: 4 },
    });

    const w7gProducts: YepProduct[] = [];
    if (response.status === 200) {
      if (response.data.STATUS === 'SUCCESS') {
        const products = response.data.DATA;
        for (const product of products) {
          let yepProductId = '';
          const pcode = product.pcode;
          switch (pcode) {
            case 'USSP01': // YEP STARTER
              yepProductId = 'products/771-A';
              break;
            case 'USYEP01': // YEP BASIC
              yepProductId = 'products/801-A';
              break;
            case 'USBP01': // YEP BUSINESS
              yepProductId = 'products/770-A';
              break;
            case 'USPP01': // YEP PRO
              yepProductId = 'products/769-A';
              break;
          }
          const yepProduct: YepProduct = new YepProduct(
            pcode,
            product.pdesc,
            product.groupname,
            product.unit,
            product.price,
            product.pv,
            product.tv,
            yepProductId
          );
          w7gProducts.push(yepProduct);
        }

        console.log('W7G Products ', w7gProducts.length);
        const tryBulkMaxlineUsers = store.bulkInsert();
        for (const product of w7gProducts) {
          await tryBulkMaxlineUsers.store(product);
        }
        await tryBulkMaxlineUsers.finish();
      }
    }
    console.log('Done...');
    process.exit(0);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
})();
