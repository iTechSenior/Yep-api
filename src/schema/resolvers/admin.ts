import { Resolver, Mutation, Ctx, Args, Arg, Query } from 'type-graphql';
import * as path from 'path';
import * as fs from 'fs';
import { initializeStore } from '@/db/index';
import { Context } from '@/helpers/interfaces';
import { APIMessageResponse, BooleanResponse } from '@/types/common';
import { Upload } from './scalars/upload';
import { getLocationsFromExcel } from '@/helpers/excel';
import { User, UserCount, MaxlineUser, W7GSSOResponse } from '@/types/user';
import { getNowUtc } from '@/helpers/utils';
import { YepCommission } from '@/types/yepCommission';
import { W7GEndpoints } from '@/helpers/w7gomc';
import { YepProduct } from '@/types/product';
import { W7GUser } from '@/types/user/W7GUser';
import moment = require('moment');
import { YepCutoff } from '@/types/yepCutoff/YepCutoff';
import shortid = require('shortid');
const node_xj = require('xls-to-json');
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const exportCSV = 'MIBAccounts.csv';

const storeUpload = (stream: any, filename: string) =>
  new Promise((resolve, reject) =>
    stream
      .pipe(fs.createWriteStream(filename))
      .on('finish', () => resolve())
      .on('error', reject)
  );

@Resolver()
export class AdminResolver {
  @Mutation(() => W7GSSOResponse)
  async w7gSSO(@Ctx() { session, req }: Context): Promise<W7GSSOResponse> {
    // Get token
    let token: string = '';
    let url = 'https://wondersevenglobal.net/app/v1.0/index.php/auth/';
    // let url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/';
    // let url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getToken : W7GEndpoints.production.getToken;
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
      token = response.data.access_token;
      console.log('w7gGetToken =', token);
    }
    if (token === '') return { success: false, link: 'Token error' };

    const yepUser = await session.load<User>(req.user.id);

    if (!yepUser.w7gUser) {
      return { success: false, link: 'Coming soon' };
    } else {
      url = 'https://wondersevenglobal.net/app/v1.0/index.php/auth/member';
      // url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getTokenMember : W7GEndpoints.production.getTokenMember;
      // url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/member';
      response = await axios({
        method: 'post',
        url,
        data: {
          mem_id: yepUser.w7gUser.memberId, // mem_id,
          mem_pass: yepUser.w7gUser.mem_pass, // mem_pass
        },
      });
      if (response.status === 200) {
        if (response.data.STATUS_CODE === 0) {
          const access_token = response.data.DATA.access_token;
          const expire = response.data.DATA.expire;
          const formatLink = 'https://wondersevenglobal.net/member/index.php?tokenm=' + access_token; // 'http://203.146.127.221/~wonder7/member/index.php?tokenm='
          return { success: true, link: formatLink };
        } else if (response.data.STATUS_CODE === 319) {
          return { success: false, link: 'Coming soon' };
        } else {
          return { success: false, link: 'Invalid Password.' };
        }
      }
    }

    return { success: false, link: 'SSO error' };
  }
  @Mutation(() => APIMessageResponse)
  async uploadMIBImport(@Arg('file', () => Upload) file: any, @Ctx() { session, req }: Context): Promise<APIMessageResponse> {
    const { createReadStream, filename } = await file;

    const filePath: string = path.resolve(`./src/${filename}`);
    const store = await initializeStore();
    const stream = createReadStream();
    await storeUpload(stream, filePath);
    const customers = await getLocationsFromExcel('Sheet1', filePath);

    // Delete the csv file
    fs.unlink(filePath, err => {
      if (err) {
        console.error(err);
      }
    });
    // Get token
    let token: string = '';
    let url = W7GEndpoints.production.getToken;
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
      token = response.data.access_token;
      console.log('w7gGetToken =', token);
    }

    const updatedMaxlineUsers: User[] = [];
    const idMap = new Map();
    const yepCutoffs: YepCutoff[] = [];

    // Get unique memberId-sponsorId map and save YepCommissions
    for (const customer of customers) {
      const memberId = customer['memberId'];
      const sponsorId = customer['sponsorId'];
      const username = customer['username'];
      const email = customer['email'];
      const firstName = customer['firstName'];
      const lastName = customer['lastName'];
      const yepId = customer['yepId'];
      const yepSponsorId = customer['yepSponsorId'];
      const maxlineNumber = customer['maxlineNumber'];
      const commission = customer['commission'];
      const orderId = customer['orderId'];
      const type = customer['type'];

      // memberId	username	email	firstName	lastName	sponsorId	yepId	yepSponsorId	maxlineNumber	commission	orderId	type
      // 1553940	corporate	corporate@myyeptribe.com	YEP	Corporate	923712	8oUbwmLDC	8Ao89SgpQ	2	2	490	Match
      console.log('customer: ', email);
      const user: User = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('email', email)
        .orElse()
        .whereEquals('maxlineId', memberId)
        .orElse()
        .openSubclause()
        .whereEquals('firstName', firstName)
        .andAlso()
        .whereEquals('lastName', lastName)
        .closeSubclause()
        .firstOrNull();

      let sponsor = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('maxlineId', sponsorId)
        .singleOrNull();

      if (!user) {
        console.log(`Can't find user:`, email);
        continue;
      }

      if (!sponsor) {
        console.log(`Can't find sponsor of `, email, ':', sponsorId);
        continue;
      }
      // Get Sponsor's information
      let placement: string = 'Right';
      if (sponsor.w7gUser) {
        if (sponsor.w7gUser.defaultPlacement) {
          placement = sponsor.w7gUser.defaultPlacement;
        }
      }

      if (!idMap.has(memberId)) {
        idMap.set(memberId, sponsorId);

        const yepCutoff = new YepCutoff(null, user.id, sponsor.id, `${user.firstName} ${user.lastName}`, user.email);

        await session.store(yepCutoff);
        yepCutoffs.push(yepCutoff);

        if (user.maxlineUser) {
          user.maxlineUser.sponsorId = sponsor.id;
          user.maxlineUser.sponsorEmail = sponsor.email;
          user.maxlineUser.status = 'Pending';
          user.updatedAt = getNowUtc();

          await session.saveChanges();
          updatedMaxlineUsers.push(user);
        }
      } else {
        continue;
      }
      // Ignore Match types
      if (type === 'Match') {
        console.log('type: Match');
        continue;
      }
      // Register User
      if (token) {
        console.log('type: Initial');
        if (!sponsor.w7gUser) {
          console.log('sponsor W7G info empty: ', sponsor.email);
          url = W7GEndpoints.production.getMemberInfo;
          while (1) {
            response = await axios({
              method: 'post',
              url,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              data: {
                email: sponsor.email.toLowerCase(), // Email
              },
            });
            if (response.status === 200) {
              console.log(response.data);
              if (response.data.STATUS_CODE === 0) {
                console.log(response.data);
                const { mem_id, email, name_t, sp_code, upa_code, side } = response.data.DATA;
                sponsor.w7gUser = new W7GUser(mem_id, upa_code, sp_code);
                await session.saveChanges();

                break;
              } else {
                console.log(`Can't find user on W7G:`, sponsor.email);
                sponsor = await session
                  .query<User>({ indexName: 'Users' })
                  .whereEquals('maxlineId', sponsor.maxlineUser.maxlineEnrollerId)
                  .singleOrNull();

                if (!sponsor) break;
              }
            }
          }
        }
        if (!sponsor || !sponsor.w7gUser) {
          continue;
        }
        const upa_code = sponsor.w7gUser.upaCode;
        const sp_code = sponsor.w7gUser.spCode;
        let mem_id = '';
        console.log(upa_code, sp_code, placement, user.birthDay);

        // Register user to W7G
        url = W7GEndpoints.production.registerNormalMember;
        response = await axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: {
            upa_code: upa_code, // Placement code
            sp_code: sp_code, // Sponsor code
            side: placement, // Side(L / R)
            name_f: 1, // Title name
            name_t: `${firstName} ${lastName}`, // Full Name
            birthday: user.birthDay, // Birthday
            national: 1, // National
            id_card: '1111111', // ID card
            email: email, // Email
            mobile: user.phone, // Mobile Phone
            address: user.address.address, // Address
            city: user.address.city, // City
            state: user.address.state, // State
            zipcode: user.address.zip, // ZipCode
            caddress: 'Deliver Address', // Delivery Address
            ccity: 'Deliver City', // Delivery City
            cstate: 'Deliver State', // Delivery State
            czipcode: 'Deliver Zip', // Delivery Zip
            locationbase: 4,
          },
        });
        if (response.status === 200) {
          if (response.data.STATUS_CODE === 0) {
            // Register success
            mem_id = response.data.DATA.mem_id;

            user.w7gUser = new W7GUser(response.data.DATA.mem_id);
            user.updatedAt = getNowUtc();

            await session.saveChanges();
          } else if (response.data.STATUS_CODE === 1017 || response.data.STATUS_CODE === 1019 || response.data.STATUS_CODE === 1020) {
            // Already registered
            console.log('Already registered:', email);
            url = W7GEndpoints.production.getMemberInfo;
            response = await axios({
              method: 'post',
              url,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              data: {
                email: email, // Email
              },
            });
            if (response.status === 200) {
              if (response.data.STATUS_CODE === 0) {
                mem_id = response.data.DATA.mem_id;

                user.w7gUser = new W7GUser(response.data.DATA.mem_id, response.data.DATA.sp_code, response.data.DATA.upa_code);
                user.updatedAt = getNowUtc();

                await session.saveChanges();
              }
            }
          } else {
            console.log(response.data);
          }
        }

        if (mem_id === '') {
          continue;
        }
        // Pay Bill
        const roles = user.roles;
        let product: YepProduct = null;
        let pcode = '';
        if (roles.indexOf('YEP STARTER') !== -1) {
          pcode = 'USSP01';
        } else if (roles.indexOf('YEP BASIC') !== -1) {
          pcode = 'USYEP01';
        } else if (roles.indexOf('YEP BUSINESS') !== -1) {
          pcode = 'USBP01';
        } else if (roles.indexOf('YEP PRO') !== -1) {
          pcode = 'USPP01';
        }

        product = await session
          .query<YepProduct>({ collection: 'YepProducts' })
          .whereEquals('pcode', pcode)
          .firstOrNull();
        if (!product) continue;
        url = W7GEndpoints.production.payBill;
        response = await axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: {
            mem_id: mem_id,
            sadate: moment().format('YYYY-MM-DD'),
            order_id: shortid(),
            pcode: product.pcode,
            pdesc: product.pdesc,
            price: product.price,
            qty: '1',
            pv: product.pv,
            total_pv: parseInt(product.pv, 10),
            total_price: parseInt(product.price, 10),
            sa_type: 'A',
          },
        });

        if (response.status === 200) {
          if (response.data.STATUS_CODE === 0) {
            console.log(response.data.DATA);
          } else console.log('Pay bill issue:', response.data);
        }
      }
    }

    const tryBulkMaxlineUsers = store.bulkInsert();
    for (const user of updatedMaxlineUsers) {
      await tryBulkMaxlineUsers.store(user, user.id);
    }

    for (const yepCutoff of yepCutoffs) {
      await tryBulkMaxlineUsers.store(yepCutoff, yepCutoff.id);
    }
    await tryBulkMaxlineUsers.finish();

    return { success: true, message: 'success' };
  }

  @Mutation(() => APIMessageResponse)
  async checkW7GMembers(@Arg('file', () => Upload) file: any, @Ctx() { session, req }: Context): Promise<APIMessageResponse> {
    const { createReadStream, filename } = await file;

    const filePath: string = path.resolve(`./src/${filename}`);
    const stream = createReadStream();
    await storeUpload(stream, filePath);
    const customers = await getLocationsFromExcel('Sheet1', filePath);

    // Delete the csv file
    fs.unlink(filePath, err => {
      if (err) {
        console.error(err);
      }
    });

    let token: string;
    let url = 'https://wondersevenglobal.net/app/v1.0/index.php/auth/';
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
      token = response.data.access_token;
      console.log('w7gGetToken =', token);
    }
    url = 'https://wondersevenglobal.net/app/v1.0/index.php/member/info/';
    let i = 0;
    const records: any = [];
    const csvPath: string = path.resolve(`./src/missing.csv`);

    // Get unique memberId-sponsorId map and save YepCommissions
    for (const customer of customers) {
      // const memberId = customer['memberId'];
      // const sponsorId = customer['sponsorId'];
      // const maxlineNumber = customer['maxlineNumber'];
      // const commission = customer['commission'];
      // const orderId = customer['orderId'];
      // const type = customer['type'];

      const memberId = customer['MIBID'];
      const sponsorId = customer['MIBSponsorId'];
      const maxlineNumber = customer['maxlineNumber'];
      const commission = customer['commission'];
      const orderId = customer['orderId'];
      const type = customer['type'];
      const email = customer['email'];
      const firstName = customer['firstName'];
      const lastName = customer['lastName'];
      const username = customer['username'];

      //"memberId","sponsorId","yepId","yepSponsorId","maxlineNumber","commission","orderId","type"
      //"1553940","923712","8oUbwmLDC","8Ao89SgpQ","2","15.000","290","Match"

      response = await axios({
        method: 'post',
        url,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        data: {
          email: email.toLowerCase(), // Email
        },
      });
      if (response.status === 200) {
        if (response.data.STATUS_CODE === 0) {
          // console.log(response.data);
          // const { mem_id, email, name_t, sp_code, upa_code, side } = response.data.DATA;
          // console.log('mem_id = ', mem_id);
          // console.log('email = ', email, '-', firstName, lastName);
          // console.log('name_t = ', name_t);
          // console.log('sp_code = ', sp_code);
          // console.log('upa_code = ', upa_code);
          // console.log('side = ', side);
        } else {
          records.push({ email: email });
          console.log(++i, ':', email, '-', firstName, lastName);
        }
      }
    }
    console.log(csvPath, records);
    const csvWriter = createCsvWriter({
      path: csvPath,
      header: [{ id: 'email', title: 'email' }],
    });
    await csvWriter
      .writeRecords(records) // returns a promise
      .then(() => {
        console.log('...Done');
      });

    return { success: true, message: 'success' };
  }

  @Query(() => APIMessageResponse)
  async w7gGetMemberInfo(@Arg('email') email: string, @Ctx() { req, session }: Context): Promise<APIMessageResponse> {
    let token: string;
    let url = 'https://wondersevenglobal.net/app/v1.0/index.php/auth/';
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
      token = response.data.access_token;
      console.log('w7gGetToken =', token);
      // url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/info/';
      url = 'https://wondersevenglobal.net/app/v1.0/index.php/member/info/';
      console.log('email = ', email);
      response = await axios({
        method: 'post',
        url,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        data: {
          email: email.toLowerCase(), // Email
        },
      });
      if (response.status === 200) {
        if (response.data.STATUS_CODE === 0) {
          console.log(response.data);
          const { mem_id, email, name_t, sp_code, upa_code, side } = response.data.DATA;
          console.log('mem_id = ', mem_id);
          console.log('email = ', email);
          console.log('name_t = ', name_t);
          console.log('sp_code = ', sp_code);
          console.log('upa_code = ', upa_code);
          console.log('side = ', side);
        } else {
          console.log(response.data);
        }
      }
    }
    return { success: true };
  }

  @Mutation(() => APIMessageResponse)
  async w7gTransferUsers(@Ctx() { req, session }: Context): Promise<APIMessageResponse> {
    try {
      let url: string, response, token: string;
      let members: YepCommission[] = [];
      // Get token
      // url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getToken : W7GEndpoints.production.getToken;
      // url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/';
      url = 'https://wondersevenglobal.net/app/v1.0/index.php/auth/';
      response = await axios({
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
        token = response.data.access_token;
        console.log('w7gGetToken =', token);
        // return { success: true };

        members = await session
          .query<YepCommission>({ collection: 'YepCommissions' })
          .all();
        for (const member of members) {
          const yepUser = await session.load<User>(member.userId);
          console.log('YepUser -->', yepUser.email);
          //if (member.type === 'Initial') {
          // Register Normal Member
          // url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.registerNormalMember : W7GEndpoints.production.registerNormalMember;
          url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/info/';
          response = await axios({
            method: 'post',
            url,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            data: {
              email: yepUser.maxlineUser.sponsorEmail, // Email
              // email: 'company@yeptribe.com', // Placement code
            },
          });

          if (response.status === 200) {
            console.log(response.data);
            if (response.data.STATUS_CODE === 0) {
              const sp_code = response.data.DATA.sp_code;
              const upa_code = response.data.DATA.upa_code;

              yepUser.w7gUser = new W7GUser('', sp_code, upa_code);
              await session.saveChanges();

              url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/add/';
              response = await axios({
                method: 'post',
                url,
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                data: {
                  upa_code: upa_code, // Placement code
                  sp_code: sp_code, // Sponsor code
                  side: member.placement, // Side(L / R)
                  name_f: 1, // Title name
                  name_t: `${yepUser.firstName} ${yepUser.lastName}`, // Full Name
                  birthday: '1993-09-18', // Birthday
                  national: 1, // National
                  id_card: '1111111', // ID card
                  email: yepUser.email, // Email
                  mobile: yepUser.phone, // Mobile Phone
                  address: yepUser.address.address, // Address
                  city: yepUser.address.city, // City
                  state: yepUser.address.state, // State
                  zipcode: yepUser.address.zip, // ZipCode
                  caddress: 'Deliver Address', // Delivery Address
                  ccity: 'Deliver City', // Delivery City
                  cstate: 'Deliver State', // Delivery State
                  czipcode: 'Deliver Zip', // Delivery Zip
                  locationbase: 4,
                },
              });
              if (response.status === 200) {
                if (response.data.STATUS_CODE === 0) {
                  console.log('mem_id, mem_pass', response.data.DATA.mem_id, response.data.DATA.mem_pass);
                  yepUser.w7gUser.memberId = response.data.DATA.mem_id;
                  yepUser.updatedAt = getNowUtc();

                  await session.saveChanges();
                } else if (response.data.STATUS_CODE === 1019) {
                  console.log('register normal user: ', response.data);
                  url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/info/';
                  response = await axios({
                    method: 'post',
                    url,
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      Authorization: `Bearer ${token}`,
                    },
                    data: {
                      email: yepUser.email, // Email
                    },
                  });
                  if (response.status === 200) {
                    if (response.data.STATUS_CODE === 0) {
                      console.log(response.data);
                      yepUser.w7gUser.memberId = response.data.DATA.mem_id;
                      yepUser.w7gUser.spCode = response.data.DATA.sp_code;
                      yepUser.w7gUser.upaCode = response.data.DATA.upa_code;
                      yepUser.updatedAt = getNowUtc();

                      await session.saveChanges();
                    }
                  }
                }
              }
            }
          }
          //}
          // Pay Bill
          // url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.payBill : W7GEndpoints.production.payBill;
          const roles = yepUser.roles;
          let product: YepProduct;
          let pcode = '';
          if (roles.indexOf('YEP STARTER') !== -1) {
            pcode = 'USSP01';
          } else if (roles.indexOf('YEP BASIC') !== -1) {
            pcode = 'USYEP01';
          } else if (roles.indexOf('YEP BUSINESS') !== -1) {
            pcode = 'USBP01';
          } else if (roles.indexOf('YEP PRO') !== -1) {
            pcode = 'USPP01';
          }

          console.log('pcode = ', pcode);
          product = await session
            .query<YepProduct>({ collection: 'YepProducts' })
            .whereEquals('pcode', pcode)
            .firstOrNull();
          console.log('product: ', product);
          url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/cart/sale/';
          response = await axios({
            method: 'post',
            url,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            data: {
              mem_id: yepUser.w7gUser.memberId,
              sadate: moment().format('YYYY-MM-DD'),
              order_id: member.orderId,
              pcode: product.pcode,
              pdesc: product.pdesc,
              price: product.price,
              qty: '1',
              pv: product.pv,
              total_pv: parseInt(product.pv, 10),
              total_price: parseInt(product.price, 10),
              sa_type: 'A',
            },
          });

          if (response.status === 200) {
            if (response.data.STATUS_CODE === 0) {
              console.log(response.data.DATA);
            } else console.log('Pay bill issue:', response.data);
          }
        }
      }
      return { success: true };
    } catch (ex) {
      console.log('error: ', ex);
      throw ex;
    }
  }

  @Mutation(() => BooleanResponse)
  async addSponsorPlacement(@Ctx() { req, session }: Context): Promise<BooleanResponse> {
    //Save YepCutoff for Sponsor Placement
    const cutOff: YepCutoff = new YepCutoff(null, 'users/184632-A', 'users/1-A', `Eugene`, 'hitcome0918@gmail.com');
    cutOff.createdAt = getNowUtc();

    await session.store(cutOff);
    await session.saveChanges();

    return { success: true };
  }
}
