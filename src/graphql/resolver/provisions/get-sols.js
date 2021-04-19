/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getSolsCount, getSols } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userIsAuthor = user.user_is_author || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "sl.sol_date DESC, sl.sol_id DESC";
  let queryOrderBy = "";
  let total = 0;
  const { orderBy, filterCountry, filterByString } = params;
  let condition = `WHERE sl.sol_id IS NOT NULL `;
  // let condition = `WHERE sl.sol_id IS NOT NULL `;
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
      if (/^\d+$/.test(filterByString)) {
        condition = `${condition} AND (sl.sol_id = ${value} OR toLower(sls.sol_name_01) CONTAINS toLower("${value}"))`;
      } else {
        condition = `${condition} AND toLower(sls.sol_name_01) CONTAINS toLower("${value}")`;
      }
    }
    const countResult = await session.run(getSolsCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    // console.log( getSols(condition, limit, offset, queryOrderBy));
    const result = await session.run(
      getSols(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const sols = result.records.map((record) => {
        const languages = [];
        const sls = {
          de: {
            sol_link: null,
            sol_name_01: null,
            sol_name_02: null,
            sol_name_03: null,
            sol_page: null,
            lang: null,
          },
          en: {
            sol_link: null,
            sol_name_01: null,
            sol_name_02: null,
            sol_name_03: null,
            sol_page: null,
            lang: null,
          },
        };

        if (record.get("sls") && record.get("sls").length > 0) {
          record.get("sls").forEach((slState) => {
            if (
              slState.lang &&
              slState.sls &&
              slState.lang.properties.iso_639_1
            ) {
              sls[slState.lang.properties.iso_639_1] = slState.sls.properties;
              sls[slState.lang.properties.iso_639_1].lang =
                slState.lang.properties;
              languages.push(slState.lang.properties.iso_639_1);
            }
          });
        }
        const slResult = {
          ...common.getPropertiesFromRecord(record, "sl"),
          sol_state: sls,
          country: common.getPropertiesFromRecord(record, "cou"),
          languageDisplay:
            languages.length > 0 ? languages.sort().join(" / ") : "-",
        };
        return slResult;
      });
      return {
        sols,
        total,
      };
    }
    session.close();
    return {
      sols: [],
      total,
    };
  } catch (error) {
    session.close();
    throw error;
  }
};
