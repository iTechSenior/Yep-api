import { Field, ObjectType, Int, ID } from 'type-graphql';
@ObjectType()
export class MaxlineUser {
  @Field(() => ID)
  yepId: string;

  @Field({ nullable: true })
  sponsorId?: string;

  @Field({ nullable: true })
  sponsorEmail?: string;

  @Field({ nullable: true })
  placementId?: string;

  @Field({ nullable: true })
  maxlinePlacementId?: string;

  @Field({ nullable: true })
  maxlineId?: string;

  @Field({ nullable: true })
  maxlineEnrollerId?: string;

  @Field({ nullable: true })
  status?: string;

  constructor(
    id: string,
    sponsorId: string = '',
    sponsorEmail: string = '',
    placementId: string = '',
    maxlinePlacementId: string = '',
    maxlineId: string = '',
    maxlineEnrollerId: string = '',
    status: string = ''
  ) {
    this.yepId = id;
    this.sponsorId = sponsorId;
    this.sponsorEmail = sponsorEmail;
    this.placementId = placementId;
    this.maxlinePlacementId = maxlinePlacementId;
    this.maxlineId = maxlineId;
    this.maxlineEnrollerId = maxlineEnrollerId;
    this.status = status;
  }
}
