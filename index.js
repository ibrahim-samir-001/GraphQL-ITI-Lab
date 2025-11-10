import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';

dotenv.config();

connectDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const token = req.headers.authorization?.split(' ')[1] || '';

    if (!token) {
      return {};
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return { user: { id: user.id, email: user.email } };
    } catch (err) {
      console.error('Invalid token');
      return {};
    }
  },
});

console.log(`🚀 Server ready at ${url}`);
