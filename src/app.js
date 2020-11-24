const express = require('express');
const server = require('./config/apollo');

const app = express();

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log('Now browse to http://localhost:4000' + server.graphqlPath)
);