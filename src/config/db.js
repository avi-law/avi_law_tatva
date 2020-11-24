const neo4j  = require("neo4j-driver");
const dotenv  = require("dotenv");
dotenv.config();

// Database credentials are stored in environment variables
// Create your own Neo4j instance with the avi law dataset at
const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

// Create a database driver instance
const dbDriver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

module.exports = dbDriver
