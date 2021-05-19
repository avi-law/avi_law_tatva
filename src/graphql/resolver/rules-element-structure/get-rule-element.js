/* eslint-disable dot-notation */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const {
  getRuleElementStateList,
  getRuleBookIDByRuleElement,
} = require("../../../neo4j/rule-element-query");
const {
  getRuleBookIssue,
  getRuleBookBreadcrumbs,
  getRuleBookStructChildNode,
  getRuleBook,
} = require("../../../neo4j/rule-book-query");
const { defaultLanguage } = require("../../../config/application");
const getRuleElementStateStatus = require("./get-rule-element-state-status");
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

const getRuleBookBreadcrumbsByRuleElement = async (object, params, ctx) => {
  const ruleBookStructId = params.rule_book_struct_id
    ? params.rule_book_struct_id
    : constants.RULE_BOOK_STRUCT_ROOT_ID;
  const ruleBookId = params.rule_book_id;
  let breadcrumbs = [];
  const rootNodeChild = [];
  const secondeNodeChild = [];
  let segment = [];
  const session = driver.session();
  try {
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
    return breadcrumbs;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  } finally {
    session.close();
  }
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleElementDocId = params.rule_element_doc_id;
  const ruleElementStateList = [];
  let settings = null;
  let response = {};
  const currentDate = _.get(params, "current_date", null);
  const hist = _.get(params, "hist", null);
  let isSingle = false;
  let nowDate = common.getTimestamp();
  let ruleBookId = null;
  if (currentDate) {
    nowDate = common.getTimestamp(currentDate);
  }
  let viewState = null;
  try {
    if (!userEmail || !ruleElementDocId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getRuleElementStateList, {
      rule_element_doc_id: ruleElementDocId,
    });
    if (result && result.records.length > 0) {
      const ruleElement = result.records.map((record) => {
        const res = {};
        if (record.get("res") && record.get("res").length > 0) {
          record.get("res").forEach((reState) => {
            if (
              reState.lang &&
              reState.res &&
              reState.lang.properties.iso_639_1
            ) {
              const properties = _.get(reState, "res.properties", null);
              if (properties) {
                if (properties.rule_element_title !== "") {
                  properties.rule_element_title = common.removeTag(
                    properties.rule_element_title
                  );
                }
                if (!res[properties.rule_element_id]) {
                  res[properties.rule_element_id] = {};
                }
                res[properties.rule_element_id][
                  reState.lang.properties.iso_639_1
                ] = properties;
                res[properties.rule_element_id][
                  reState.lang.properties.iso_639_1
                ].identity = _.get(reState, "res.identity", null);

                const status = getRuleElementStateStatus(
                  _.cloneDeep(
                    res[properties.rule_element_id][
                      reState.lang.properties.iso_639_1
                    ]
                  ),
                  nowDate
                );
                res[properties.rule_element_id][
                  reState.lang.properties.iso_639_1
                ].rule_element_status = status;
                const solState = _.get(reState, "sls.properties", null);
                if (solState) {
                  const solObject = {
                    sol_state: solState,
                  };
                  res[properties.rule_element_id][
                    reState.lang.properties.iso_639_1
                  ].sol = solObject;
                }
                const createdLog = _.get(reState, "createdLog", null);
                if (createdLog) {
                  res[properties.rule_element_id][
                    reState.lang.properties.iso_639_1
                  ].createdLog = createdLog;
                }
                const updatedLog = _.get(reState, "updatedLog", null);
                if (updatedLog) {
                  res[properties.rule_element_id][
                    reState.lang.properties.iso_639_1
                  ].updatedLog = updatedLog;
                }
              }
            }
          });
        }
        if (res && Object.keys(res).length > 0) {
          Object.keys(res).forEach((e) => {
            if (!hist) {
              if (Object.keys(res[e]).length === 2) {
                const deActive = _.get(res[e], "de.rule_element_status", null);
                const enActive = _.get(res[e], "en.rule_element_status", null);
                if (
                  enActive === constants.RULE_ELEMENT_STATE_STATUS.GREEN &&
                  deActive === constants.RULE_ELEMENT_STATE_STATUS.GREEN
                ) {
                  viewState = res[e];
                }
              } else if (Object.keys(res[e]).length === 1) {
                const deActive = _.get(res[e], "de.rule_element_status", null);
                const enActive = _.get(res[e], "en.rule_element_status", null);
                if (
                  enActive === constants.RULE_ELEMENT_STATE_STATUS.GREEN ||
                  deActive === constants.RULE_ELEMENT_STATE_STATUS.GREEN
                ) {
                  viewState = res[e];
                  isSingle = true;
                }
              }
            }
            ruleElementStateList.push(res[e]);
          });
        }
        const reResult = {
          re: common.getPropertiesFromRecord(record, "re"),
          res: ruleElementStateList,
        };
        return reResult;
      });
      response = {
        ...response,
        ...ruleElement[0],
      };
    }

    const rbResult = await session.run(getRuleBookIDByRuleElement, {
      rule_element_doc_id: ruleElementDocId,
    });
    const rbRecord = _.get(rbResult, "records[0]", null);
    ruleBookId = rbRecord.get("rule_book_id");
    if (ruleBookId) {
      response.breadcrumbs = await getRuleBookBreadcrumbsByRuleElement(
        object,
        {
          rule_book_id: ruleBookId,
        },
        ctx
      );
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
    response.isSingle = isSingle;
    response.view = viewState;
    response.language_preference_settings = settings;
    console.log(response);
    return response;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
