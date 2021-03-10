/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getRuleBooks } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  let ruleBookList = [];
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getRuleBooks);
    ruleBookList = result.records.map((record) => {
      const bookResult = record.get("value");
      return bookResult;
    });
    // console.log(JSON.stringify(ruleBookList[0]));
    return ruleBookList[0];
  } catch (error) {
    session.close();
    throw error;
  }
};
