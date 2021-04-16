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

const getBreadcrumbs = (child, segments, breadcrumbs) => {
  const original = _.cloneDeep(segments);
  const remainingSegment = _.cloneDeep(segments.splice(2, segments.length - 1));
  if (remainingSegment) {
    remainingSegment.forEach((data) => {
      const array = [];
      const labelStart = _.get(data, "start.labels[0]", null);
      const labelEnd = _.get(data, "end.labels[0]", null);
      if (labelStart) {
        if (labelStart === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT) {
          const structId = _.get(
            data,
            "start.properties.rule_book_struct_id",
            null
          );
          const structchild = _.find(child, { rule_book_struct_id: structId })
            .has_rule_book_struct_child;
          if (structchild && structchild.length > 0) {
            structchild.forEach((rbs) => {
              const nodeChildObject = {};
              nodeChildObject.type =
                constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT;
              nodeChildObject.ID = _.get(rbs, "rule_book_struct_id", null);
              nodeChildObject.isActive = _.get(
                rbs,
                "rule_book_struct_active",
                false
              );
              nodeChildObject.title_en = _.get(
                rbs,
                "has_rule_book_struct_state.en.rule_book_struct_desc",
                null
              );
              nodeChildObject.title_de = _.get(
                rbs,
                "has_rule_book_struct_state.de.rule_book_struct_desc",
                null
              );
              array.push(nodeChildObject);
            });
          }
          const bookChild = _.find(child, { rule_book_struct_id: structId })
            .has_rule_book_child;
          if (bookChild && bookChild.length > 0) {
            bookChild.forEach((structChild) => {
              const nodeChildObject = {};
              nodeChildObject.type = constants.DRAG_AND_DROP_TYPE.RULE_BOOK;
              nodeChildObject.ID = _.get(structChild, "rule_book_id", null);
              nodeChildObject.isActive = _.get(
                structChild,
                "rule_book_active",
                false
              );
              nodeChildObject.title_en = _.get(
                structChild,
                "has_rule_book_issue_state.en.title_short",
                null
              );
              nodeChildObject.title_de = _.get(
                structChild,
                "has_rule_book_issue_state.de.title_short",
                null
              );
              array.push(nodeChildObject);
            });
          }
          if (labelEnd === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT) {
            child = structchild;
          }
          if (labelEnd === constants.DRAG_AND_DROP_TYPE.RULE_BOOK) {
            child = bookChild;
          }
        } else if (labelStart === constants.DRAG_AND_DROP_TYPE.RULE_BOOK) {
          const bookId = _.get(data, "start.properties.rule_book_id", null);
          const findChild = _.find(child, { rule_book_id: bookId });
          if (findChild && findChild.has_rule_book_child) {
            child = findChild.has_rule_book_child;
            if (child && child.length > 0) {
              child.forEach((bookChild) => {
                const nodeChildObject = {};
                nodeChildObject.type = constants.DRAG_AND_DROP_TYPE.RULE_BOOK;
                nodeChildObject.ID = _.get(bookChild, "rule_book_id", null);
                nodeChildObject.isActive = _.get(
                  bookChild,
                  "rule_book_active",
                  false
                );
                nodeChildObject.title_en = _.get(
                  bookChild,
                  "has_rule_book_issue_state.en.title_short",
                  null
                );
                nodeChildObject.title_de = _.get(
                  bookChild,
                  "has_rule_book_issue_state.de.title_short",
                  null
                );
                array.push(nodeChildObject);
              });
            }
          }
        }
      }
      if (array.length) {
        breadcrumbs.push({ node: array });
      }
    });
  }
  if (original.length > 0) {
    original.forEach((data, index) => {
      let id = null;
      const labelEnd = _.get(data, "end.labels[0]", null);
      if (labelEnd) {
        if (labelEnd === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT) {
          id = _.get(data, "end.properties.rule_book_struct_id", null);
        } else if (labelEnd === constants.DRAG_AND_DROP_TYPE.RULE_BOOK) {
          id = _.get(data, "end.properties.rule_book_id", null);
        }
        if (_.get(breadcrumbs, `${index}.node`, []).length > 0) {
          const findObject = _.find(breadcrumbs[index].node, { ID: id });
          findObject.isView = true;
        }
      }
    });
  }
  return breadcrumbs;
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  const ruleBookStructId = params.rule_book_struct_id
    ? params.rule_book_struct_id
    : constants.RULE_BOOK_STRUCT_ROOT_ID;
  const ruleBookId = params.rule_book_id;
  let breadcrumbs = [];
  const rootNodeChild = [];
  const secondeNodeChild = [];
  let segment = [];
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
        nodeChildObject.type = constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT;
        nodeChildObject.ID = common.getPropertiesFromRecord(
          record,
          "rbs2"
        ).rule_book_struct_id;
        nodeChildObject.isActive = common.getPropertiesFromRecord(
          record,
          "rbs2"
        ).rule_book_struct_active;
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
      breadcrumbs.push({ node: rootNodeChild });
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
      segment = breadcrumbsResult.records[0].get("p").segments;
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
          nodeChildObject.type = constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT;
          nodeChildObject.ID = _.get(child, "rule_book_struct_id", null);
          nodeChildObject.isActive = _.get(
            child,
            "rule_book_struct_active",
            null
          );
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
        breadcrumbs.push({ node: secondeNodeChild });
        // console.log(JSON.stringify(treeStructure));
        breadcrumbs = await getBreadcrumbs(
          treeStructure.has_rule_book_struct_child,
          segment,
          breadcrumbs
        );
      }
    }
    const getRuleBookResult = await session.run(getRuleBook, {
      rule_book_id: ruleBookId,
    });
    if (getRuleBookResult && getRuleBookResult.records.length > 0) {
      const ruleBooks = getRuleBookResult.records.map((record) => {
        const solList = [];
        const rbis = null;
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
    // console.log(response);
    return response;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  }
};
