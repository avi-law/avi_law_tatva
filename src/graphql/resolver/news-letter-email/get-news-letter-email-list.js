/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const {
  getNewsLetterEmailList,
  getNewsLetterEmailListCount,
} = require("../../../neo4j/query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userIsAuthor = user.user_is_author || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "nle.nl_email_ord DESC";
  let queryOrderBy = "";
  const condition = "";
  let total = 0;
  try {
    if (!userIsSysAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const { orderBy } = params;
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((newsLetterEmail) => {
        const field = newsLetterEmail.slice(
          0,
          newsLetterEmail.lastIndexOf("_")
        );
        const last = newsLetterEmail.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `nle.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, nle.${field} ${last}`;
        }
      });
    }
    const countResult = await session.run(
      getNewsLetterEmailListCount(condition)
    );
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const result = await session.run(
      getNewsLetterEmailList(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const nlEmails = result.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nle"),
          nl_email_state: {
            ...common.getPropertiesFromRecord(record, "nles"),
          },
        };
        return nlResult;
      });
      return {
        nlEmails,
        total,
      };
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
