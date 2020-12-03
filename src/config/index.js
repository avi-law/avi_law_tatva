const dotenv = require("dotenv");
const application = require("./application");
const driver = require("./db");
const server = require("./apollo");

const envFound = dotenv.config();

if (!envFound) {
  // This error should crash whole process
  throw new Error("Couldn't find .env file.");
}

module.exports = {
  ...application,
  driver,
  server,
};
