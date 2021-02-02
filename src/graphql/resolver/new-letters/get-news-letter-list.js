/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getNewsLetterListCount,
  getNewsLetterList,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "nl.nl_ord DESC";
  let queryOrderBy = "";
  let total = 0;
  const { orderBy, lang } = params;
  const condition = `WHERE lang.iso_639_1 = "${lang}" `;
  try {
    if (!userIsSysAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((newsLetter) => {
        const field = newsLetter.slice(0, newsLetter.lastIndexOf("_"));
        const last = newsLetter.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `nl.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, nl.${field} ${last}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const countResult = await session.run(getNewsLetterListCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      getNewsLetterList(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const nls = result.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nl"),
          nl_state: {
            ...common.getPropertiesFromRecord(record, "nls"),
            nl_language: common.getPropertiesFromRecord(record, "lang"),
          },
          country: common.getPropertiesFromRecord(record, "cou"),
        };
        return nlResult;
      });
      return {
        nls,
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
