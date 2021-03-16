/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const {
  searchNLQuery,
  getSolsCount,
  getSols,
  getUser,
} = require("../../../neo4j/query");

const getUserDetails = async (email) => {
  const session = driver.session();
  const result = await session.run(getUser, { user_email: email });
  if (result && result.records.length > 0) {
    const userData = result.records.map((record) => {
      const userResult = {
        user: common.getPropertiesFromRecord(record, "u"),
        user_state: common.getPropertiesFromRecord(record, "us"),
        lang1: common.getPropertiesFromRecord(record, "lang1"),
        lang2: common.getPropertiesFromRecord(record, "lang2"),
        lang3: common.getPropertiesFromRecord(record, "lang3"),
        cou1: common.getPropertiesFromRecord(record, "cou1"),
        cou3: record.get("cou3"),
      };
      return userResult;
    });
    return userData[0];
  }
};

const searchNl = async (user, params) => {
  const { country } = params;
  const searchNL = {
    nl_list: [],
    total: 0,
  };
  if (country) {
    country.push("EU");
  }
  const queryParams = {
    ...params,
    country,
  };
  const session = driver.session();
  try {
    const nlResult = await session.run(searchNLQuery(queryParams));
    if (nlResult && nlResult.records.length > 0) {
      const newsLetters = nlResult.records.map((record) => {
        const nls = {
          de: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
          en: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
        };
        if (record.get("nls") && record.get("nls").length > 0) {
          record.get("nls").forEach((nlState) => {
            if (
              nlState.lang &&
              nlState.nls &&
              nlState.lang.properties.iso_639_1
            ) {
              nls[nlState.lang.properties.iso_639_1] = nlState.nls.properties;
              nls[nlState.lang.properties.iso_639_1].nl_text = null;
            }
          });
        }
        const nlResultArray = {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
        };
        return nlResultArray;
      });
      searchNL.nl_list = newsLetters;
      searchNL.total = newsLetters.length;
    }
    return searchNL;
  } catch (error) {
    session.close();
    throw error;
  }
};

const searchSols = async (user, params) => {
  const userEmail = user ? user.user_email : null;
  let userDetails = null;
  let mainInterestCountry = null;
  if (userEmail) {
    userDetails = await getUserDetails(userEmail);
    mainInterestCountry = userDetails.cou1.iso_3166_1_alpha_2;
  }
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "sl.sol_date DESC, sl.sol_id DESC";
  let queryOrderBy = "";
  let total = 0;
  const { solsOrderBy, text, lang } = params;
  let condition = `WHERE sl.sol_id IS NOT NULL `;
  // let condition = `WHERE sl.sol_id IS NOT NULL `;
  try {
    if (solsOrderBy && solsOrderBy.length > 0) {
      solsOrderBy.forEach((sl) => {
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

    if (text) {
      const value = text.replace(
        constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX,
        ""
      );
      condition = `${condition} AND (toLower(sls.sol_name_01) CONTAINS toLower("${value}") OR toLower(sls.sol_name_02) CONTAINS toLower("${value}"))`;
    }
    if (mainInterestCountry) {
      condition = `${condition} AND cou.iso_3166_1_alpha_2 = "${mainInterestCountry}"`;
    }
    const countResult = await session.run(getSolsCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
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
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const response = {
    searchNL: {
      nl_list: [],
      total: 0,
    },
    searchSols: {
      sols: [],
      total: 0,
    },
  };
  const session = driver.session();
  try {
    response.searchNL = await searchNl(user, params);
    response.searchSols = await searchSols(user, params);
    return response;
  } catch (error) {
    session.close();
    throw error;
  }
};
