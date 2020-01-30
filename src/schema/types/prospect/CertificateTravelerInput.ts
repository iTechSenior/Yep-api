import { Field, InputType } from 'type-graphql';
import { MaritalStatusEnum } from '../Enums';

@InputType()
export class CertificateTravelerInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  dateOfBirth: Date;

  @Field(() => MaritalStatusEnum)
  maritalStatus: MaritalStatusEnum;
}
