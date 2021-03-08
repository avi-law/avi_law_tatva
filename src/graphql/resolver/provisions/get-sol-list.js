/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getSolCount, getSols } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userIsAuthor = user.user_is_author || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "sl.sol_id ASC";
  let queryOrderBy = "";
  let total = 0;
  const { orderBy, filterCountry, filterByString } = params;
  let condition = `WHERE sl.sol_id IS NOT NULL`;
  try {
    if (!userIsSysAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((sl) => {
        const field = sl.slice(0, sl.lastIndexOf("_"));
        const last = sl.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `sl.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, sl.${field} ${last}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    if (filterCountry && filterCountry.length > 0) {
      filterCountry.forEach((country) => {
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
      condition = `${condition} AND ( toLower(sls.sol_name_01) CONTAINS toLower("${value}"))`;
    }
    console.log(condition);
    const countResult = await session.run(getSolCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      getSols(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const sols = result.records.map((record) => {
        const slResult = {
          ...common.getPropertiesFromRecord(record, "sl"),
          sol_state: {
            ...common.getPropertiesFromRecord(record, "sls"),
            lang: common.getPropertiesFromRecord(record, "lang"),
          },
          country: common.getPropertiesFromRecord(record, "cou"),
        };
        return slResult;
      });
      return {
        sols,
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
