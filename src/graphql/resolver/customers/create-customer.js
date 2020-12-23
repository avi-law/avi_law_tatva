/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");

module.exports = (object, params) => {
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  try {
    console.log("params", params);
    return false;
  } catch (error) {
    session.close();
    throw error;
  }
};
