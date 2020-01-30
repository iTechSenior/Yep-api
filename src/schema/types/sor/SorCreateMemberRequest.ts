import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class SorCreateMemberRequest {
  @Field()
  Email: string;

  @Field()
  ContractNumber: string;

  @Field()
  Address: string;

  @Field()
  City: string;

  @Field()
  State: string;

  @Field()
  PostalCode: string;

  @Field()
  TwoLetterCountryCode: string;

  @Field()
  Phone: string;

  @Field()
  Password: string;

  @Field()
  FirstName: string;

  @Field()
  LastName: string;

  @Field(() => Int)
  UserAccountTypeID: number;

  constructor(
    Email: string,
    ContractNumber: string,
    Address: string,
    City: string,
    State: string,
    PostalCode: string,
    TwoLetterCountryCode: string,
    Phone: string,
    Password: string,
    FirstName: string,
    LastName: string,
    UserAccountTypeID: number
  ) {
    this.Email = Email;
    this.ContractNumber = ContractNumber;
    this.Address = Address;
    this.City = City;
    this.State = State;
    this.PostalCode = PostalCode;
    this.TwoLetterCountryCode = TwoLetterCountryCode;
    this.Phone = Phone;
    this.Password = Password;
    this.FirstName = FirstName;
    this.LastName = LastName;
    this.UserAccountTypeID = UserAccountTypeID;
  }
}
