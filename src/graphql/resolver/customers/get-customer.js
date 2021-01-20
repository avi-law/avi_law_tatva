/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getCustomer, isExistsUserInCustomer } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userEmail = user.user_email;
  const session = driver.session();
  const customerId = params.customer_id;
  try {
    if (!userIsSysAdmin) {
      await session
        .run(isExistsUserInCustomer, {
          user_email: userEmail,
          cust_id: customerId,
        })
        .then((result) => {
          if (result && result.records.length > 0) {
            const singleRecord = result.records[0];
            if (!singleRecord.get("count")) {
              throw new APIError({
                lang: userSurfLang,
                message: "INTERNAL_SERVER_ERROR",
              });
            }
            return true;
          }
          throw new APIError({
            lang: userSurfLang,
            message: "INTERNAL_SERVER_ERROR",
          });
        })
        .catch((error) => {
          session.close();
          throw error;
        });
    }
    const result = await session.run(getCustomer, { customerId });
    if (result && result.records) {
      const singleRecord = result.records[0];
      return singleRecord.get(0);
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
