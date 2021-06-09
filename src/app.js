const express = require("express");
const cors = require("cors");
const path = require("path");
const { server, corsConfig } = require("./config");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "50mb" }));
// app.use(cors(corsConfig));
server.applyMiddleware({ app });

app.listen({ port: process.env.PORT || 4000 }, () =>
  console.log(
    `Now browse to http://localhost:${process.env.PORT}${server.graphqlPath}` ||
      4000 + server.graphqlPath
  )
);
