import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import express, { Request, Response } from 'express';
import jwt from 'express-jwt';
import expressPlayground from 'graphql-playground-middleware-express';
import * as path from 'path';

import { CustomRequest } from '@/helpers/interfaces';
import { initializeStore } from '@/db/index';
import { createSchema } from '@/resolvers/index';

(async () => {
  const prefix = process.env.NODE_ENV === 'development' ? './' : './build/';
  dotenv.config({ path: `${prefix}.env` });

  const store = await initializeStore();
  // Create Express server
  const app = express();

  // Express configuration
  app.set('port', process.env.PORT || 5000);
  app.set('env', process.env.NODE_ENV || 'production');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(
    cors({
      credentials: true,
      origin: '*',
    })
  );

  app.use(
    jwt({
      credentialsRequired: false,
      secret: process.env['JWT_SECRET_KEY'],
      getToken: req => {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          return req.headers.authorization.split(' ')[1];
        }
        return undefined;
      },
    })
  );

  // swallow the JWT Expired Exception
  app.use((err: any, req: Request, res: Response, next: any) => {
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.resolve(`${prefix}`)));
  }

  // app.use(session({
  //   resave: true,
  //   saveUninitialized: true,
  //   secret: SESSION_SECRET,
  // }));

  // const typeDefs = fs.readFileSync(path.resolve(`${serverDir}schema.graphql`)).toString();
  // const schema = makeExecutableSchema({
  //   typeDefs,
  //   resolvers,
  // });

  const schema = await createSchema();

  const server = new ApolloServer({
    schema,
    context: ({ req, res }: any) => {
      const session = store.openSession();
      return {
        store,
        session,
        req,
        res,
      };
    },
    tracing: process.env.NODE_ENV === 'development',
    cacheControl: process.env.NODE_ENV === 'development',
    introspection: process.env.NODE_ENV === 'development',
  });
  server.applyMiddleware({ app });

  app.use('*', (req: CustomRequest, res: any, next) => {
    req.db = store;
    next();
  });

  // Set up app routes.
  require('./src/routes')(app);

  if (process.env.NODE_ENV !== 'production') {
    app.get('/playground', expressPlayground({ endpoint: '/graphql' }));
  }

  // if (process.env.NODE_ENV === 'production') {
  //   app.use(express.static(path.resolve(`${prefix}`)));
  //   app.get('*', (req, res) => {
  //     res.sendFile(path.join(path.resolve(`${prefix}`), 'index.html'));
  //   });
  // }

  // Start Express server.
  app.listen(app.get('port'), () => {
    console.log(`🚀 Server ready at http://localhost:%d${server.graphqlPath} in %s mode`, app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
  });
})().catch(err => console.log(err));
