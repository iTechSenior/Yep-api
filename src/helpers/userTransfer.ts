import {
  sorTransferMemberFromBoomerangToPlus,
  sorTransferMemberFromBoomerangToVip,
  sorTransferMemberFromPlusToViP,
  sorTransferMemberFromVipToPlus,
} from './sor';
import { TransferUser } from '@/types/user';
import { Roles } from './utils';

export const transferUser = async (userInfo: TransferUser): Promise<boolean> => {
  const { email, fromRole, toRole } = userInfo;
  try {
    switch (fromRole) {
      case Roles.TVVip:
        return await sorTransferMemberFromVipToPlus(email);
        break;
      case Roles.TVBoomerang:
        if (toRole === Roles.TVPlus) {
          return await sorTransferMemberFromBoomerangToPlus(email);
          break;
        } else if (toRole === Roles.TVVip) {
          return await sorTransferMemberFromBoomerangToVip(email);
          break;
        }
      case Roles.TVPlus:
        return await sorTransferMemberFromPlusToViP(email);
        break;
      default:
        return false;
    }
  } catch (ex) {
    throw new Error(ex.message);
  }
};
