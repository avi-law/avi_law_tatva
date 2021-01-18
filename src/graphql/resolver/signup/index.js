/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");

module.exports = (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  try {
    console.log("params", params);
    return true;
    // const result = await session.run(createNewCustomerSate, queryParams);
    // if (result && result.records.length > 0) {
    //   return true;
    // }
    throw new APIError({
      lang: defaultLanguage,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
