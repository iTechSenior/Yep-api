import { ObjectType, Field, Int } from 'type-graphql';
import { ProductSetup } from '../product';
import { PromoCode } from './PromoCode';
import { CertificateReference } from '@/types/certificate';
@ObjectType()
export class FunnelStepProduct {
  @Field()
  id: string;

  @Field()
  displayName: string;

  @Field(() => Int)
  amount: number;

  @Field()
  interval: string;

  @Field(() => ProductSetup, { nullable: true })
  setup?: ProductSetup;

  @Field(() => [PromoCode], { nullable: true })
  promoCodes?: PromoCode[];

  @Field(() => [CertificateReference], { nullable: true })
  certificates?: CertificateReference[];

  constructor(
    id: string,
    displayName: string,
    amount: number,
    interval: string,
    setup?: ProductSetup,
    promoCodes?: PromoCode[],
    certificates?: CertificateReference[]
  ) {
    this.id = id;
    this.displayName = displayName;
    this.amount = amount;
    this.interval = interval;
    this.setup = setup;
    this.promoCodes = promoCodes;
    this.certificates = certificates;
  }
}
