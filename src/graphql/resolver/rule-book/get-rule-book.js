/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, APIError, constants } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const {
  getRuleBookIssue,
  getRuleBookBreadcrumbs,
  getRuleBookStructChildNode,
  getRuleBook,
} = require("../../../neo4j/rule-book-query");
const { defaultLanguage } = require("../../../config/application");
const getRulebookStructure = require("../rule-book-structure/get-rule-book-structure");

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
  const rootNodeChild = [];
  const secondeNodeChild = [];
  let settings = null;
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
    const getRootStructureChildResult = await session.run(
      getRuleBookStructChildNode,
      {
        rule_book_struct_id: ruleBookStructId,
      }
    );
    if (
      getRootStructureChildResult &&
      getRootStructureChildResult.records.length > 0
    ) {
      getRootStructureChildResult.records.forEach((record) => {
        const rbss = record.get("rbsState");
        const nodeChildObject = {
          title_en: null,
          title_de: null,
        };
        nodeChildObject.ID = common.getPropertiesFromRecord(
          record,
          "rbs2"
        ).rule_book_struct_id;
        if (rbss && rbss.length > 0) {
          rbss.forEach((rbsState) => {
            if (
              rbsState.lang &&
              rbsState.rbss &&
              rbsState.lang.properties.iso_639_1
            ) {
              nodeChildObject[`title_${rbsState.lang.properties.iso_639_1}`] =
                rbsState.rbss.properties.rule_book_struct_desc;
            }
          });
        }
        rootNodeChild.push(nodeChildObject);
      });
      breadcrumbs.push(rootNodeChild);
    }

    const breadcrumbsResult = await session.run(getRuleBookBreadcrumbs, {
      rule_book_struct_id: ruleBookStructId,
      rule_book_id: ruleBookId,
    });
    if (breadcrumbsResult && breadcrumbsResult.records.length > 0) {
      breadcrumbsResult.records.forEach((record) => {
        const data = record.get("p");
        if (data && data.length > 2) {
          const label = _.get(data, "segments[1].start.labels[0]", null);
          if (label) {
            if (label === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT) {
              params.rule_book_struct_id = _.get(
                data,
                "segments[1].start.properties.rule_book_struct_id",
                null
              );
            }
          }
        }
      });
    }
    if (params.rule_book_struct_id) {
      const treeStructure = await getRulebookStructure(object, params, ctx);
      if (
        treeStructure &&
        treeStructure.has_rule_book_struct_child &&
        treeStructure.has_rule_book_struct_child.length > 0
      ) {
        treeStructure.has_rule_book_struct_child.forEach((child) => {
          const nodeChildObject = {};
          nodeChildObject.ID = _.get(child, "rule_book_struct_id", null);
          nodeChildObject.title_en = _.get(
            child,
            "has_rule_book_struct_state.en.rule_book_struct_desc",
            null
          );
          nodeChildObject.title_de = _.get(
            child,
            "has_rule_book_struct_state.de.rule_book_struct_desc",
            null
          );
          secondeNodeChild.push(nodeChildObject);
        });
        breadcrumbs.push(secondeNodeChild);
      }
    }
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
    if (userEmail) {
      const settingResult = await session.run(getUser, {
        user_email: userEmail,
      });
      if (settingResult && settingResult.records.length > 0) {
        const userData = settingResult.records.map((record) => {
          const userResult = {
            left: common.getPropertiesFromRecord(record, "lang2").iso_639_1,
            right: common.getPropertiesFromRecord(record, "lang3").iso_639_1,
          };
          return userResult;
        });
        settings = userData[0];
      }
    }
    response.language_preference_settings = settings;
    response.breadcrumbs = breadcrumbs;
    console.log(response);
    return response;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  }
};
