import { ArgsType } from 'type-graphql';
import { FunnelUserOrder } from './FunnelUserOrder';

@ArgsType()
export class RegisterItexArgs {
  values: FunnelUserOrder;
  requestedOnboardingCall: boolean;
}
