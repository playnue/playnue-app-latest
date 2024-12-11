// apolloClient.js
import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://local.hasura.local.nhost.run/v1/graphql', // Replace with your GraphQL endpoint
  cache: new InMemoryCache(),
});

export default client;
