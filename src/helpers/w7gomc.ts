import { YepCommission } from '@/types/yepCommission';
import { User } from '@/types/user';
import { IDocumentSession } from 'ravendb';
import { getNowUtc } from './utils';
import { W7GUser } from '@/types/user/W7GUser';
import { YepProduct } from '@/types/product';
import moment = require('moment');
import shortid = require('shortid');

const axios = require('axios');

export const W7GEndpoints = {
  production: {
    getToken: 'https://wondersevenglobal.net/app/v1.0/index.php/auth/',
    registerNormalMember: 'https://wondersevenglobal.net/app/v1.0/index.php/member/add/',
    payBill: 'https://wondersevenglobal.net/app/v1.0/index.php/member/cart/sale/',
    payBillCancel: 'https://wondersevenglobal.net/app/v1.0/index.php/member/cart/sale/cancel/',
    getMemberInfo: 'https://wondersevenglobal.net/app/v1.0/index.php/member/info',
    updateMemberInfo: 'https://wondersevenglobal.net/app/v1.0/index.php/member/edit',
    getTokenMember: 'https://wondersevenglobal.net/app/v1.0/index.php/auth/member',
    getProductInfo: 'https://wondersevenglobal.net/app/v1.0/index.php/product/info',
  },
  test: {
    getToken: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/',
    registerNormalMember: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/add/',
    payBill: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/cart/sale/',
    payBillCancel: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/cart/sale/cancel/',
    getMemberInfo: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/info',
    updateMemberInfo: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/',
    getTokenMember: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/member',
    getProductInfo: 'http://203.146.127.221/~wonder7/app/v1.0/index.php/product/info',
  },
};

export const w7gRegisterAndPayUser = async (yepUser: User, sponsor: User, session: IDocumentSession) => {
  try {
    let url: string, response, token: string;
    // Get token
    // url = process.env.NODE_ENV === 'production' ? W7GEndpoints.production.getToken : W7GEndpoints.test.getToken;
    url = W7GEndpoints.production.getToken;
    console.log(url);
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
      // url = process.env.NODE_ENV === 'production' ? W7GEndpoints.production.registerNormalMember : W7GEndpoints.test.registerNormalMember;
      url = W7GEndpoints.production.registerNormalMember;
      let placement = 'R';
      if (sponsor.w7gUser.defaultPlacement) placement = sponsor.w7gUser.defaultPlacement;
      console.log(sponsor.w7gUser);
      response = await axios({
        method: 'post',
        url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: {
          upa_code: sponsor.w7gUser.memberId, // Placement code
          sp_code: sponsor.w7gUser.memberId, // Sponsor code
          side: placement, // Side(L / R)
          name_f: 1, // Title name
          name_t: `${yepUser.firstName} ${yepUser.lastName}`, // Full Name
          birthday: yepUser.birthDay, // Birthday
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
      console.log(response.data);
      if (response.status === 200) {
        if (response.data.STATUS_CODE === 0) {
          console.log('mem_id, mem_pass', response.data.DATA.mem_id, response.data.DATA.mem_pass);
          const mem_id = response.data.DATA.mem_id;
          const mem_pass = response.data.DATA.mem_pass;

          // url = process.env.NODE_ENV === 'production' ? W7GEndpoints.production.getMemberInfo : W7GEndpoints.test.getMemberInfo;
          url = W7GEndpoints.production.getMemberInfo;
          response = await axios({
            method: 'post',
            url,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            data: {
              email: yepUser.email, // Email
            },
          });
          if (response.status === 200) {
            if (response.data.STATUS_CODE === 0) {
              yepUser.w7gUser = new W7GUser(mem_id, response.data.DATA.upa_code, response.data.DATA.sp_code);
              yepUser.w7gUser.mem_pass = mem_pass;
              yepUser.updatedAt = getNowUtc();

              await session.saveChanges();
            }
          }
        }
      } else return false;
      // Pay Bill
      // url = process.env.NODE_ENV === 'production' ? W7GEndpoints.production.payBill : W7GEndpoints.test.payBill;
      url = W7GEndpoints.production.payBill;
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
          return true;
        } else {
          console.log('Pay bill issue:', response.data);
          return false;
        }
      }
    } else {
      return false;
    }
  } catch (ex) {
    console.log('w7GRegisterAndPayBill error', ex.message);
    await session.saveChanges();
  }
};

export const w7gTransferUsers = async (user: string, password: string, session: IDocumentSession) => {
  try {
    let url: string, response, token: string;
    let products;
    const members: YepCommission[] = [];
    // Get token
    url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getToken : W7GEndpoints.production.getToken;
    url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/';
    response = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        auth_user: user,
        auth_pass: password,
      },
    });
    if (response.status === 200) {
      token = response.data.access_token;
      console.log('w7gGetToken =', token);

      for (const member of members) {
        const yepUser = await session.load<User>(member.userId);
        if (member.type === 'Initial') {
          const payload = {
            upa_code: member.userId, // Placement code
            sp_code: member.sponsorId, // Sponsor code
            side: member.placement, // Side(L / R)
            name_f: 1, // Title name
            name_t: yepUser.name(), // Full Name
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
          };
          // Register Normal Member
          url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.registerNormalMember : W7GEndpoints.production.registerNormalMember;
          url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/member/add/';
          response = await axios({
            method: 'post',
            url,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Bearer ${token}`,
            },
            data: payload,
          });
          if (response.status === 200) {
            if (response.data.STATUS_CODE === 0) {
              yepUser.w7gUser.memberId = response.data.DATA.mem_id;
              yepUser.updatedAt = getNowUtc();

              await session.saveChanges();
            }
          }
        }
        // Get Products Info
        url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getProductInfo : W7GEndpoints.production.getProductInfo;
        response = await axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
          },
          data: { locationbase: 1 },
        });
        if (response.status === 200) {
          const output = response.data;
          if (output.STATUS === 'SUCCESS') {
            products = output.DATA;
            // Pay Bill
            url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.payBill : W7GEndpoints.production.payBill;
            for (const product of products) {
              response = await axios({
                method: 'post',
                url,
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  //Authorization: `Bearer ${token}`,
                },
                data: {
                  mem_id: yepUser.w7gUser.memberId,
                  sadate: getNowUtc(),
                  order_id: member.orderId,
                  pcode: product.pcode,
                  pdesc: product.pdesc,
                  price: product.price,
                  qty: product.qty,
                  pv: product.pv,
                  total_pv: product.total_pv,
                  total_price: product.total_price,
                  sa_type: 'A',
                },
              });
            }
          }

          // return {
          //   success: true,
          //   pcode: output.DATA.pcode,
          //   pdesc: output.DATA.pdesc,
          //   groupname: output.DATA.groupname,
          //   unit: output.DATA.unit,
          //   price: output.DATA.price,
          //   pv: output.DATA.pv,
          //   type: output.DATA.type,
          // };
        }
      }
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gGetToken = async (user: string, password: string) => {
  const payload = {
    auth_user: user,
    auth_pass: password,
  };

  try {
    let url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getToken : W7GEndpoints.production.getToken;
    url = 'http://203.146.127.221/~wonder7/app/v1.0/index.php/auth/';
    console.log(url);
    const response = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: payload,
    });
    if (response.status === 200) {
      const output = response.data;
      console.log('w7gGetToken =', output);

      if (output.STATUS === 'SUCCESS') {
        console.log(output.data);
        return { success: true, token: output.DATA.access_token, expire: output.DATA.expire };
      }
      if (output.STATUS === 'FAIL') return { success: false, message: 'USER or PASS Token cannot used or expired.' };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gRegisterNormalMember = async (
  token: string,
  upa_code: string,
  sp_code: string,
  side: string,
  name_f: number,
  name_t: string,
  birthday: string,
  national: number,
  id_card: string,
  email: string,
  mobile: string,
  address: string,
  city: string,
  state: string,
  zipcode: string,
  caddress: string,
  ccity: string,
  cstate: string,
  czipcode: string,
  locationbase: number
) => {
  const payload = {
    headers: { Authorization: `Bearer ${token}` },
    upa_code,
    sp_code,
    side,
    name_f,
    name_t,
    birthday,
    national,
    id_card,
    email,
    mobile,
    address,
    city,
    state,
    zipcode,
    caddress,
    ccity,
    cstate,
    czipcode,
    locationbase,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.registerNormalMember : W7GEndpoints.production.registerNormalMember;
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS') return { success: true, memberCode: output.data.mem_id };

      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 999:
            failMessage = 'TOKEN FAILED OR EXPIRE';
            reason = 'Token Authorized cannot used or expired';
            break;
          case 1016:
            failMessage = 'ID CARD EMPTY';
            reason = 'Value id_card is empty';
            break;
          case 1017:
            failMessage = 'ID CARD DUPLICATE';
            reason = 'id_card has been already';
            break;
          case 1018:
            failMessage = 'EMAIL EMPTY';
            reason = 'Value email ';
            break;
          case 1019:
            failMessage = 'EMAIL DUPLICATE';
            reason = 'Email has been already';
            break;
          case 1020:
            failMessage = 'UPLINE HAS BEEN ALREADY';
            reason = 'Upline has been already';
            break;
          case 1022:
            failMessage = 'LOCATION BASE IS EMPTY';
            reason = 'Value location base is empty';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gPayBill = async (
  token: string,
  mem_id: string,
  sadate: string,
  order_id: string,
  pcode: string,
  pdesc: string,
  price: string,
  qty: string,
  pv: string,
  total_pv: number,
  total_price: number,
  sa_type: string
) => {
  const payload = {
    headers: { Authorization: `Bearer ${token}` },
    mem_id,
    sadate,
    order_id,
    pcode,
    pdesc,
    price,
    qty,
    pv,
    total_pv,
    total_price,
    sa_type,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.payBill : W7GEndpoints.production.payBill;
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS') return { success: true, mem_id: output.DATA.mem_id, order_id: output.DATA.order_id };
      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 999:
            failMessage = 'TOKEN FAILED OR EXPIRE';
            reason = 'Token Authorized cannot used or expired';
            break;
          case 1012:
            failMessage = 'MEMBER NOT FOUND';
            reason = 'Specified Member code not found';
            break;
          case 300:
            failMessage = 'MEMBER ID EMPTY';
            reason = 'Value member code is empty';
            break;
          case 330:
            failMessage = 'ORDER ID IS DUPLICATE';
            reason = 'Value order id has been already.';
            break;
          case 308:
            failMessage = 'PRODUCT CODE EMPTY';
            reason = 'Product code empty';
            break;
          case 311:
            failMessage = 'BILL REFERENCE EMPTY';
            reason = 'Bill reference empty';
            break;
          case 310:
            failMessage = 'PRODUCT CODE DOES NOT MATCH';
            reason = 'Product code not found in system';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gPayBillCancel = async (token: string, mem_id: string, order_id: string) => {
  const payload = {
    headers: { Authorization: `Bearer ${token}` },
    mem_id,
    order_id,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.payBillCancel : W7GEndpoints.production.payBillCancel;

    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS') return { success: true, mem_id: output.DATA.mem_id, order_id: output.DATA.order_id };
      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 999:
            failMessage = 'TOKEN FAILED OR EXPIRE';
            reason = 'Token Authorized cannot used or expired';
            break;
          case 313:
            failMessage = 'BILL REFERENCE HAS BEEN CANCELED';
            reason = 'Bill already cancel';
            break;
          case 311:
            failMessage = 'BILL REFERENCE EMPTY';
            reason = 'Bill reference empty';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gGetMemberInfo = async (token: string, mem_id: string, email: string) => {
  const payload = {
    headers: { Authorization: `Bearer ${token}` },
    mem_id,
    email,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getMemberInfo : W7GEndpoints.production.getMemberInfo;
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS')
        return {
          success: true,
          mem_id: output.DATA.mem_id,
          email: output.DATA.email,
          name_t: output.DATA.name_t,
          sp_code: output.DATA.sp_code,
          upa_code: output.DATA.upa_code,
          side: output.DATA.side,
        };
      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 999:
            failMessage = 'TOKEN FAILED OR EXPIRE';
            reason = 'Token Authorized cannot used or expired';
            break;
          case 319:
            failMessage = 'USER DOES NOT EXIST';
            reason = 'User does not exist';
            break;
          case 320:
            failMessage = 'EMAIL DOES NOT EXIST';
            reason = 'Email does not exist';
            break;
          case 321:
            failMessage = 'USER & EMAIL EMPTY';
            reason = 'Empty Member code, Email';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gUpdateMemberInfo = async (token: string, mem_id: string, mem_pass: string, email: string) => {
  const payload = {
    headers: { Authorization: `Bearer ${token}` },
    mem_id,
    mem_pass,
    email,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.updateMemberInfo : W7GEndpoints.production.updateMemberInfo;
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS')
        return {
          success: true,
          mem_id: output.DATA.mem_id,
        };
      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 999:
            failMessage = 'TOKEN FAILED OR EXPIRE';
            reason = 'Token Authorized cannot used or expired';
            break;
          case 319:
            failMessage = 'USER DOES NOT EXIST';
            reason = 'User does not exist';
            break;
          case 321:
            failMessage = 'USER & EMAIL EMPTY';
            reason = 'Empty Member code';
            break;
          case 1019:
            failMessage = 'EMAIL DUPLICATE';
            reason = 'Empty has been already';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gGetTokenMember = async (token: string, mem_id: string, mem_pass: string) => {
  const payload = {
    headers: { Authorization: `Bearer ${token}` },
    mem_id,
    mem_pass,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getTokenMember : W7GEndpoints.production.getTokenMember;
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS')
        return {
          success: true,
          access_token: output.DATA.access_token,
          expire: output.DATA.expire,
        };
      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 319:
            failMessage = 'USER DOES NOT EXIST';
            reason = 'User does not exist';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const w7gGetProductInfo = async (locationbase: string) => {
  const payload = {
    locationbase,
  };

  try {
    const url = process.env.NODE_ENV === 'development' ? W7GEndpoints.test.getProductInfo : W7GEndpoints.production.getProductInfo;
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      const output = response.data;
      if (output.STATUS === 'SUCCESS')
        return {
          success: true,
          pcode: output.DATA.pcode,
          pdesc: output.DATA.pdesc,
          groupname: output.DATA.groupname,
          unit: output.DATA.unit,
          price: output.DATA.price,
          pv: output.DATA.pv,
          type: output.DATA.type,
        };
      let failMessage, reason;
      if (output.STATUS === 'FAIL') {
        const code = output.STATUS_CODE;
        switch (code) {
          case 1022:
            failMessage = 'LOCATIONBASE IS EMPTY';
            reason = 'Value locationbase is empty';
            break;
        }
      }
      return { success: false, failMessage, reason };
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};
