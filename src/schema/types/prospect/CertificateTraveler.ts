import { Field, ObjectType } from 'type-graphql';
import { MaritalStatusEnum } from '../Enums';

@ObjectType()
export class CertificateTraveler {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  dateOfBirth: Date;

  @Field(() => MaritalStatusEnum)
  maritalStatus: MaritalStatusEnum;
}
