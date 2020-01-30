import { AbstractIndexCreationTask } from 'ravendb';

class ContactEmails extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from contactEmails in docs.ContactEmails
    let contact = LoadDocument(contactEmails.contactId, "Contacts")
    select new
    {
        Query = new
        {
            firstName = contact.firstName,
            lastName = contact.lastName,
            email = contactEmails.email,
            tag = contactEmails.tag,
            userId = contact.user.id
        },
        firstName = contact.firstName,
        lastName = contact.lastName,
        contactId = contactEmails.contactId,
        email = contactEmails.email,
        tag = contactEmails.tag,
        userId = contact.user.id,
        created = new DateTime(contact.createdAt.Year, contact.createdAt.Month, contact.createdAt.Day, contact.createdAt.Hour,contact.createdAt.Minute,contact.createdAt.Second)
    }`;

    this.store('userId', 'Yes');
    this.store('firstName', 'Yes');
    this.store('lastName', 'Yes');
  }
}

export { ContactEmails };
