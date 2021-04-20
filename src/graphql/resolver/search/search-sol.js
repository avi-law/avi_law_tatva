/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const {
  searchSolQueryCount,
  searchSolQuery,
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

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  let showAll = false;
  const userEmail = user ? user.user_email : null;
  let userDetails = null;
  const searchSol = {
    sols: [],
    total: 0,
  };
  let mainInterestCountry = null;
  if (userEmail) {
    userDetails = await getUserDetails(userEmail);
    mainInterestCountry = userDetails.cou1.iso_3166_1_alpha_2;
  }
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "sl.sol_date DESC";
  let queryOrderBy = "";
  let total = 0;
  const { solStateOrderBy, text, solOrderBy } = params;
  if (params.showAll) {
    showAll = params.showAll;
  }
  let condition = `WHERE sl.sol_id IS NOT NULL `;
  // let condition = `WHERE sl.sol_id IS NOT NULL `;
  try {
    if (solStateOrderBy && solStateOrderBy.length > 0) {
      solStateOrderBy.forEach((sol) => {
        const field = sol.slice(0, sol.lastIndexOf("_"));
        const last = sol.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `sls.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, sls.${field} ${last}`;
        }
      });
    }
    if (solOrderBy && solOrderBy.length > 0) {
      solOrderBy.forEach((sl) => {
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
      condition = `${condition} AND (toLower(sls.sol_name_01) CONTAINS toLower("${value}") OR toLower(sls.sol_name_02) CONTAINS toLower("${value}") OR toLower(sls.sol_name_03) CONTAINS toLower("${value}"))`;
    }
    if (mainInterestCountry && !showAll) {
      condition = `${condition} AND cou.iso_3166_1_alpha_2 = "${mainInterestCountry}"`;
    }
    const countResult = await session.run(searchSolQueryCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      searchSolQuery(condition, limit, offset, queryOrderBy)
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
              if (slState.sls.properties.sol_link) {
                languages.push(
                  `<a target="_blank" href="${slState.sls.properties.sol_link}">${slState.lang.properties.iso_639_1}</a>`
                );
              } else {
                languages.push(
                  `<span>${slState.lang.properties.iso_639_1}</span>`
                );
              }
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
      searchSol.sols = sols;
      searchSol.total = total;
      return searchSol;
    }
    session.close();
    return searchSol;
  } catch (error) {
    session.close();
    throw error;
  }
};
