/* eslint-disable no-param-reassign */

const jwt = require("jsonwebtoken");
const { jwtSecret, jwtAlgorithms } = require("../../../config/application");

const verifyAndDecodeToken = (req) => {
  const response = false;
  try {
    if (
      !req ||
      !req.headers ||
      (!req.headers.authorization && !req.headers.Authorization) ||
      (!req && !req.cookies && !req.cookies.token)
    ) {
      return response;
    }
    if (!req.headers.authorization.startsWith("Bearer ")) {
      return response;
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    if (jwtToken) {
      return jwt.verify(jwtToken, jwtSecret, {
        algorithms: jwtAlgorithms,
      });
    }
    return response;
  } catch (err) {
    return response;
  }
};
module.exports = (object, params, ctx) => {
  const { req } = ctx;
  const decoded = verifyAndDecodeToken(req);
  if (decoded) {
    return JSON.stringify({ success: true, ...decoded });
  }
  return JSON.stringify({ success: false });
};
