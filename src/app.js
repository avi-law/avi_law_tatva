const express = require("express");
const { server } = require("./config");
require("dotenv").config();

const app = express();

server.applyMiddleware({ app });

app.listen({ port: process.env.PORT || 4000 }, () =>
  console.log(
    `Now browse to http://localhost:${process.env.PORT}${server.graphqlPath}` ||
      4000 + server.graphqlPath
  )
);
