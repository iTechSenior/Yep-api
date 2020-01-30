import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

export const Upload = new GraphQLScalarType({
  name: 'Upload',
  description: 'File Upload',
  parseValue(value) {
    return value; // value from the client
  },
  serialize(value) {
    return value; // value sent to the client
  },
});
