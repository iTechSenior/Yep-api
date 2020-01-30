import { Resolver, Query, Args, Ctx } from 'type-graphql';
import { Document } from '@/types/document';
import { verifyAccess, Roles } from '@/helpers/utils';
import { GetDocuments } from '@/types/certificate';
import { Context } from '@/helpers/interfaces';

@Resolver(() => Document)
export class DocumentResolver {
  @Query(() => [Document])
  async getDocuments(@Args() { type, skip = 0, pageSize = 100 }: GetDocuments, @Ctx() { session, req }: Context): Promise<Document[]> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);

    const query = session
      .query<Document>({ collection: 'Documents' })
      .skip(skip ? skip : 0)
      .take(pageSize ? pageSize : 25);

    if (type) query.whereEquals('type', type);

    return query.all();
  }
}
