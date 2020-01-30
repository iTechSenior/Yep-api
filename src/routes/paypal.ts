import { Router, Response } from 'express';
const ipn = require('express-ipn');
import querystring from 'querystring';
import request from 'request';
import { Agent } from 'http';
const router = Router();

export const validationHandler = (err: Error, ipnContent: any) => {
  if (err) {
    console.error('IPN invalid'); // The IPN was invalid
  } else {
    console.log(ipnContent); // The IPN was valid.
    // Process the IPN data
  }
};

router.get('/', (req, res) => {
  res.status(200).send('Paypal IPN Listener');
  res.end('Response will be available on console, nothing to look here!');
});

router.post('/ipn', (req, res) => {
  console.log('Received POST /'.bold);
  console.log(req.body);
  console.log('\n\n');

  // STEP 1: read POST data
  req.body = req.body || {};
  res.status(200).send('OK');
  res.end();

  // read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
  let postreq = 'cmd=_notify-validate';
  for (const key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      const value = querystring.escape(req.body[key]);
      postreq = postreq + '&' + key + '=' + value;
    }
  }

  // Step 2: POST IPN data back to PayPal to validate
  console.log('Posting back to paypal'.bold);
  console.log(postreq);
  console.log('\n\n');
  let options = {
    url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
    method: 'POST',
    headers: {
      Connection: 'close',
    },
    body: postreq,
    strictSSL: true,
    rejectUnauthorized: false,
    requestCert: true,
    agent: new Agent(),
  };

  request(options, function callback(error: any, response: any, body: any) {
    if (!error && response.statusCode === 200) {
      // inspect IPN validation result and act accordingly
      if (body.substring(0, 8) === 'VERIFIED') {
        // The IPN is verified, process it
        console.log('Verified IPN!');
        console.log('\n\n');

        // assign posted variables to local variables
        let item_name = req.body['item_name'];
        let item_number = req.body['item_number'];
        let payment_status = req.body['payment_status'];
        let payment_amount = req.body['mc_gross'];
        let payment_currency = req.body['mc_currency'];
        let txn_id = req.body['txn_id'];
        let receiver_email = req.body['receiver_email'];
        let payer_email = req.body['payer_email'];

        // Lets check a variable
        console.log('Checking variable'.bold);
        console.log('payment_status:', payment_status);
        console.log('\n\n');

        // IPN message values depend upon the type of notification sent.
        // To loop through the &_POST array and print the NV pairs to the screen:
        console.log('Printing all key-value pairs...'.bold);
        for (let key in req.body) {
          if (req.body.hasOwnProperty(key)) {
            const value = req.body[key];
            console.log(key + '=' + value);
          }
        }
      } else if (body.substring(0, 7) === 'INVALID') {
        // IPN invalid, log for manual investigation
        console.log('Invalid IPN!');
        console.log('\n\n');
      }
    }
  });
});

export default router;
