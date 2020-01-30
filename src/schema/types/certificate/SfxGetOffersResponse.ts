import { ObjectType, Field , Int} from 'type-graphql';
import { SfxOffer } from './SfxOffer';

@ObjectType()
export class SfxGetOffersResponse {
  @Field(() => Int)
  status: number;

  @Field(() => [SfxOffer])
  offers: SfxOffer[];
}
