import { AbstractIndexCreationTask } from 'ravendb';

class ShareableContents extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from contents in docs.ShareableContents
    select new
    {
        Query = new
        {
          category = contents.category,
          subCategory = contents.subCategory,
          subject = contents.subject,
          email = contents.email,
          text = contents.text,
          sms = contents.sms,
          title = contents.title,
          url = contents.url,
          brand = contents.brand,
          updatedAt = contents.updatedAt
        },
        category = contents.category,
        subCategory = contents.subCategory,
        subject = contents.subject,
        email = contents.email,
        text = contents.text,
        sms = contents.sms,
        title = contents.title,
        url = contents.url,
        brand = contents.brand,
        updatedAt = contents.updatedAt
    }`;
  }
}

export { ShareableContents };
