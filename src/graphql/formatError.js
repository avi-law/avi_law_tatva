/* eslint-disable no-param-reassign */
const dbErrorCode = ["Neo.ClientError.Statement.SyntaxError"];
const { common } = require("../utils");

module.exports = (err) => {
  const { code } = err.extensions;
  const lang = err.extensions.exception.lang || "en";
  // Don't give the specific errors to the client.
  if (dbErrorCode.indexOf(code) !== -1) {
    return {
      message: "Internal server error",
      statusCode: "INTERNAL_SERVER_ERROR",
    };
  }
  let { message, statusCode } = common.getMessage(err.message, lang);
  if (!statusCode) {
    message = "Internal server error";
    statusCode = "INTERNAL_SERVER_ERROR";
  }
  return { message, statusCode };
  // Otherwise return the original error.  The error can also
  // be manipulated in other ways, so long as it's returned.
  // return err;
};
