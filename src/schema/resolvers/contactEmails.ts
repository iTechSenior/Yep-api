import { Context } from '../../helpers/interfaces';
import { verifyAccess, formatSearchTerm } from '../../helpers/utils';
import { QueryStatistics, IDocumentQuery } from 'ravendb';
import { ContactEmail, ContactEmailCount, ContactEmailByUUID, GetContactEmailArgs, ContactEmailInfo } from '@/types/contactEmail';
import { Query, Ctx, Args, Resolver } from 'type-graphql';
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import { Contact } from '@/types/contact';
@Resolver(() => ContactEmail)
export class ContactEmailsResolver {
  @Query(() => ContactEmailCount)
  async getContactEmails(
    @Args() { skip, searchText, pageSize }: TablePaginationWithSearchTextArgs,
    @Ctx() { session, req }: Context
  ): Promise<ContactEmailCount> {
    // verifyAccess(req, [Roles.Administrator]);
    let contactEmails: any[];
    let stats: QueryStatistics;
    const searchTerm = formatSearchTerm(searchText.split(' '));
    contactEmails = await session
      .query<ContactEmailInfo>({ indexName: 'ContactEmails' })
      .search('Query', searchTerm)
      .statistics(s => (stats = s))
      .selectFields(['firstName', 'lastName', 'email', 'tag', 'createdAt', 'isSent'])
      .take(pageSize)
      .skip(skip)
      .all();

    return { contactEmail: contactEmails, totalRows: stats.totalResults };
  }

  @Query(() => ContactEmailByUUID)
  async getContactEmail(@Args() { uuid }: GetContactEmailArgs, @Ctx() { session, req }: Context): Promise<ContactEmailByUUID> {
    const contact = await session
      .query<Contact>({ indexName: 'Contacts' })
      .whereEquals('uuid', uuid)
      .firstOrNull();
    return { email: contact.email };
  }
}
