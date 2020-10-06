const PORT = process.env.PORT || 4000;
const express = require('express');
const { ApolloServer, gql, UserInputError } = require('apollo-server-express');
const { PubSub } = require('apollo-server');
const cors = require('cors');
const Message = require('./models/message');
const mongoose = require('mongoose');
const pubsub = new PubSub();
const app = express();
const http = require('http');
require('dotenv').config();

app.use(cors());

// database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((err) => {
    console.error(err);
  });

const typeDefs = gql`
  type Message {
    message: String!
    profilePic: String
    username: String
    image: String
    date: String!
    id: ID!
  }
  type Query {
    allMessages: [Message!]!
  }
  type Mutation {
    addMessage(
      message: String!
      profilePic: String
      username: String!
      image: String
    ): Message
  }
  type Subscription {
    messageAdded: Message!
  }
`;

const resolvers = {
  Query: {
    allMessages: () => Message.find({}),
  },
  Mutation: {
    addMessage: async (root, args) => {
      const message = new Message({ ...args, date: Date.now() });

      try {
        await message.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }

      pubsub.publish('MESSAGE_ADDED', { messageAdded: message });
      return message;
    },
  },
  Subscription: {
    messageAdded: {
      subscribe: () => pubsub.asyncIterator(['MESSAGE_ADDED']),
    },
  },
};
const server = new ApolloServer({ typeDefs, resolvers });
// middlewares
app.use(express.json());
server.applyMiddleware({ app });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(PORT, () => {
  console.log(`SERVER is listening on ${PORT}`);
});
