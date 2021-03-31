/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getNewsLetterListCount,
  getNewsLetterList,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userIsAuthor = user.user_is_author || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "nl.nl_ord DESC";
  let queryOrderBy = "";
  let total = 0;
  const { orderBy, filterByCountry, filterByString, lang } = params;
  let condition = `WHERE lang.iso_639_1 = "${lang}" `;
  try {
    if (!userIsSysAdmin && !userIsAuthor) {
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

    if (filterByCountry && filterByCountry.length > 0) {
      filterByCountry.forEach((country) => {
        Object.keys(country).forEach((key) => {
          if (/^\d+$/.test(country[key])) {
            condition = `${condition} AND cou.${key} = ${country[key]}`;
          } else {
            condition = `${condition} AND cou.${key} = '${country[key]}'`;
          }
        });
      });
    }
    if (filterByString) {
      const value = filterByString.replace(
        constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX,
        ""
      );
      condition = `${condition} AND ( toLower(nls.nl_title_long) CONTAINS toLower("${value}") OR toLower(nl.nl_no) CONTAINS toLower("${value}"))`;
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
        const nlState = common.getPropertiesFromRecord(record, "nls");
        const nlStateLanguage = common.getPropertiesFromRecord(record, "lang");
        if (nlState && !nlState.nl_title_long) {
          nlState.nl_title_long =
            constants.NL_TITLE_NOT_AVAILABLE[nlStateLanguage.iso_639_1];
        }
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nl"),
          nl_state: {
            ...nlState,
            nl_language: nlStateLanguage,
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
