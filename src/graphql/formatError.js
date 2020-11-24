
const dbErrorCode = [
  "Neo.ClientError.Statement.SyntaxError"
];


module.exports = (err) => {
  const code = err.extensions.exception.code;
  // Don't give the specific errors to the client.
  if(dbErrorCode.indexOf(code) !== -1 ) {
    return new Error('Internal server error');
  }
  // Otherwise return the original error.  The error can also
  // be manipulated in other ways, so long as it's returned.
  return err;
};