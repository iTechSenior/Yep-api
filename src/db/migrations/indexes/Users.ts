import { AbstractIndexCreationTask } from 'ravendb';

class Users extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from user in docs.Users
select new
{
  Query = new
  {
      user.firstName,
      user.lastName,
      user.roles,
      user.email,
      user.username,
  },
  user.firstName,
  user.lastName,
  user.roles,
  user.email,
  user.username,
  user.active,
  user.createdAt,
  user.uuid,
  coinmdMemberNumber = user.coinMD.memberNumber,
  coinmdSponsorMemberNumber = user.coinMD.sponsorMemberNumber,
  coinmdSponsorEmail = user.coinMD.sponsorEmail,
  sponsorId = user.sponsor.id,
  sponsorEmail = user.sponsor.email,
  ancestors = user.ancestry.ancestors,
  depth = user.ancestry.depth,
  cryptoTransactionId = user.crypto.transactionId,
  subscriptionId = user.stripe.subscription.subscriptionId,
  clickFunnels = user.clickFunnelsAffiliateUrls,
  mobileDeviceIds = Enumerable.Select(user.mobileDevices, device => device.deviceId),
  maxlineId = user.maxlineUser.maxlineId,
  maxlineEnrollerId = user.maxlineUser.maxlineEnrollerId,
  maxlineYepId = user.maxlineUser.yepId,
  maxlineStatus = user.maxlineUser.status,
  maxlineSponsorId = user.maxlineUser.sponsorId,
  proPayAccountNumber = user.proPay.accountNumber,
  coordinates = CreateSpatialField(user.coordinate.lat, user.coordinate.lng)
}`;
  }
}

export { Users };
