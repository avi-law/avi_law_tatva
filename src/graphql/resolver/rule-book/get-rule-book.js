/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, APIError, constants } = require("../../../utils");
const {
  getRuleBookIssue,
  getRuleBookBreadcrumbs,
  getRuleBookStructChildNode,
  getRuleBook,
} = require("../../../neo4j/rule-book-query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  const ruleBookStructId = params.rule_book_struct_id
    ? params.rule_book_struct_id
    : constants.RULE_BOOK_STRUCT_ROOT_ID;
  const ruleBookId = params.rule_book_id;
  const breadcrumbs = [];
  let response = {
    isSingle: true,
  };
  try {
    if (!userEmail || !ruleBookId) {
      session.close();
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    // const getRootStructureChild = await session.run(
    //   getRuleBookStructChildNode,
    //   {
    //     rule_book_struct_id: ruleBookStructId,
    //   }
    // );
    // const breadcrumbsResult = await session.run(getRuleBookBreadcrumbs, {
    //   rule_book_struct_id: ruleBookStructId,
    //   rule_book_id: ruleBookId,
    // });
    // console.log(breadcrumbsResult);
    const getRuleBookResult = await session.run(getRuleBook, {
      rule_book_id: ruleBookId,
    });
    if (getRuleBookResult && getRuleBookResult.records.length > 0) {
      const ruleBooks = getRuleBookResult.records.map((record) => {
        const solList = [];
        const rbis = {};
        if (record.get("rbis") && record.get("rbis").length > 0) {
          if (record.get("rbis").length > 1) {
            response.isSingle = false;
          }
          record.get("rbis").forEach((rbisState) => {
            if (
              rbisState.lang &&
              rbisState.rbis &&
              rbisState.lang.properties.iso_639_1
            ) {
              rbis[rbisState.lang.properties.iso_639_1] =
                rbisState.rbis.properties;
            }
          });
        }
        if (record.get("sl") && record.get("sl").length > 0) {
          record.get("sl").forEach((slNode) => {
            const solObject = {
              sl: slNode.sol.properties,
              sol_type_id: null,
            };
            const sls = {
              de: {
                sol_link: null,
                sol_name_01: null,
                sol_name_02: null,
                sol_name_03: null,
                sol_page: null,
              },
              en: {
                sol_link: null,
                sol_name_01: null,
                sol_name_02: null,
                sol_name_03: null,
                sol_page: null,
              },
            };
            if (slNode.sls.length > 0) {
              slNode.sls.forEach((slState) => {
                if (
                  slState.lang &&
                  slState.sls &&
                  slState.lang.properties.iso_639_1
                ) {
                  sls[slState.lang.properties.iso_639_1] =
                    slState.sls.properties;
                }
              });
            }
            solObject.sls = sls;
            solList.push(solObject);
          });
        }
        const rbiResult = {
          rbi: common.getPropertiesFromRecord(record, "rbi"),
          rbis,
          sol_list: solList,
        };
        return rbiResult;
      });
      response = {
        ...response,
        ...ruleBooks[0],
      };
    }
    return response;
  } catch (error) {
    session.close();
    throw error;
  }
};
