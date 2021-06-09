/* eslint-disable no-param-reassign */

const jwt = require("jsonwebtoken");
const { jwtSecret, jwtAlgorithms } = require("../../../config/application");

const verifyAndDecodeToken = (params) => {
  const { token } = params;
  const response = false;
  try {
    if (!token.startsWith("Bearer ")) {
      return response;
    }
    const jwtToken = token.split(" ")[1];
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
  const decoded = verifyAndDecodeToken(params);
  if (decoded) {
    return JSON.stringify({ success: true, ...decoded });
  }
  return JSON.stringify({ success: false });
};
