import { Field, ArgsType } from 'type-graphql';

@ArgsType()
export class GetCertificatesForProspect {
  @Field({ nullable: true })
  searchTerm?: string;
}
