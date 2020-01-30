import { AbstractIndexCreationTask } from 'ravendb';

class Contacts extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from contacts in docs.Contacts
    select new
    {
        Query = new
        {
            firstName = contacts.firstName,
            lastName = contacts.lastName,
            email = contacts.email,
            tag = contacts.tag,
        },
        userId = contacts.user.id,
        firstName = contacts.firstName,
        lastName = contacts.lastName,
        email = contacts.deliveryEndpoint,
        tag = contacts.deliveryMethod,
    }`;
  }
}

export { Contacts };
