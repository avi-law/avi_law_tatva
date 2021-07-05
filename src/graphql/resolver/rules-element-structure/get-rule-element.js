/* eslint-disable dot-notation */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const {
  getRuleElementStateList,
  getRuleBookIDByRuleElement,
  logRuleElementState,
  logRuleElement,
  getRuleElementStateDetailsWithLog,
  getRuleElementShortestPath,
  getAMCGMRuleElementForFE,
  getBackToRuleElementForFE,
} = require("../../../neo4j/rule-element-query");
const {
  getRuleBookBreadcrumbs,
  getRuleBookStructChildNode,
} = require("../../../neo4j/rule-book-query");
const { getRulesElementStructure } = require("../../../neo4j/tree-query");
const { defaultLanguage } = require("../../../config/application");
const getRuleElementStateStatus = require("./get-rule-element-state-status");
const getRulebookStructure = require("../rule-book-structure/get-rule-book-structure");

const getRuleElementStructure = async (ruleBookId, ruleBookIssueNo) => {
  const session = driver.session();
  let ruleElementStructureList = [];
  try {
    const result = await session.run(getRulesElementStructure, {
      rule_book_id: ruleBookId,
      rule_book_issue_no: ruleBookIssueNo,
    });
    if (result.records && result.records.length > 0) {
      ruleElementStructureList = result.records.map((record) => {
        const ruleBook = record.get("rule_book");
        const ruleBookResponse = {
          rule_book_active: ruleBook.rule_book_active,
          rule_book_id: ruleBook.rule_book_id,
          rule_book_issue: _.get(ruleBook, "has_rule_book_issue[0]", null),
        };
        return ruleBookResponse;
      });
      const ruleElementTreeStructureData = _.get(
        ruleElementStructureList,
        "[0]",
        null
      );
      return ruleElementTreeStructureData;
    }
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  } finally {
    session.close();
  }
};

const getStatesAndUpdateStatus = (ruleElementState, nowDate) => {
  if (ruleElementState && ruleElementState.length > 0) {
    const stateData = _.cloneDeep(ruleElementState);
    const stateObject = [];
    ruleElementState = [];
    stateData.forEach((stateElement) => {
      const obj = { en: null, de: null };
      const lang = stateElement.rule_element_state_language_is[0].iso_639_1;
      obj[lang] = {
        ...stateElement,
      };

      if (obj[lang].rule_element_title !== "") {
        obj[lang].rule_element_title_display = common.removeTag(
          obj[lang].rule_element_title
        );
      }
      const status = getRuleElementStateStatus(_.cloneDeep(obj[lang]), nowDate);
      if (status === constants.RULE_ELEMENT_STATE_STATUS.GREEN) {
        obj[lang].identity = stateElement["_id"];
        obj[lang].rule_element_status = status;
        delete obj[lang].rule_element_state_language_is;
        stateObject.push(obj);
      } else if (status === constants.RULE_ELEMENT_STATE_STATUS.BLUE) {
        obj[lang].identity = stateElement["_id"];
        obj[lang].rule_element_status = status;
        delete obj[lang].rule_element_state_language_is;
        stateObject.push(obj);
      }
    });

    const deList = [];
    const enList = [];
    stateObject.forEach((el) => {
      if (el.de) {
        deList.push(el.de);
      }
      if (el.en) {
        enList.push(el.en);
      }
    });
    const activeState = { en: null, de: null };
    if (enList.length > 0) {
      activeState.en = enList[enList.length - 1];
    }
    if (deList.length > 0) {
      activeState.de = deList[deList.length - 1];
    }
    if (activeState.en || activeState.de) {
      ruleElementState.push(activeState);
    }
    return ruleElementState;
  }
  return null;
};

const ruleElementShortestPath = async (ruleBookId, ruleElementDocId) => {
  const session = driver.session();
  let segment = null;
  try {
    const breadcrumbsResult = await session.run(getRuleElementShortestPath, {
      rule_element_doc_id: ruleElementDocId,
      rule_book_id: ruleBookId,
    });

    if (breadcrumbsResult && breadcrumbsResult.records.length > 0) {
      segment = breadcrumbsResult.records[0].get("p").segments;
    }
    return segment;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  } finally {
    session.close();
  }
};

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
          if (findObject) {
            findObject.isView = true;
          }
        }
      }
    });
  }
  return breadcrumbs;
};

const getRuleElementTitle = (stateList, lang) => {
  let ruleElementTitle = _.get(stateList, `0.${lang}.rule_element_article`, "");
  let title = _.get(stateList, `0.${lang}.rule_element_title`, null);
  if (title !== "" && title) {
    title = common.removeTag(title);
    ruleElementTitle = `${ruleElementTitle} (${title})`;
  }
  return ruleElementTitle;
};

const getAllRuleElementList = (elementArray, allElements, ruleBookId) => {
  if (elementArray.length > 0) {
    elementArray.forEach((element) => {
      if (element.rule_element_header_lvl === 0) {
        const ruleElementStateList = _.get(
          element,
          "has_rule_element_state",
          null
        );
        const stateList = getStatesAndUpdateStatus(
          ruleElementStateList,
          common.getTimestamp()
        );
        const childRuleElementDocId = _.get(
          element,
          "rule_element_doc_id",
          null
        );
        const nodeChildObject = {};
        nodeChildObject.type = constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT;
        nodeChildObject.ID = childRuleElementDocId;
        nodeChildObject.isActive = true;
        nodeChildObject.isElementIsRuleBook = _.get(
          element,
          "rule_element_is_rule_book",
          null
        );
        nodeChildObject.ruleElementHeaderLevel = _.get(
          element,
          "rule_element_header_lvl",
          null
        );
        nodeChildObject.ruleElementRuleBookId = ruleBookId;
        nodeChildObject.title_en = getRuleElementTitle(stateList, "en");
        nodeChildObject.title_de = getRuleElementTitle(stateList, "de");
        allElements.push(nodeChildObject);
      }
      if (element.has_rule_element) {
        getAllRuleElementList(
          element.has_rule_element,
          allElements,
          ruleBookId
        );
      }
    });
  }
};

const getElementBreadcrumbs = (child, segments, breadcrumbs, otherData) => {
  const allElements = [];
  const { ruleBookId, ruleElementDocId } = otherData;
  getAllRuleElementList(
    _.get(child, "has_rule_element", null),
    allElements,
    ruleBookId
  );
  const original = _.cloneDeep(segments);
  const remainingSegment = _.cloneDeep(original.splice(1, original.length - 1));
  // console.log(remainingSegment);
  if (segments) {
    segments.forEach((data) => {
      const array = [];
      const labelStart = _.get(data, "start.labels[0]", null);
      // const labelEnd = _.get(data, "end.labels[0]", null);
      if (labelStart) {
        if (labelStart === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE) {
          const ruleBookIssueElementchild = _.get(
            child,
            "has_rule_element",
            null
          );
          if (
            ruleBookIssueElementchild &&
            ruleBookIssueElementchild.length > 0
          ) {
            ruleBookIssueElementchild.forEach((rbs) => {
              const ruleElementStateList = _.get(
                rbs,
                "has_rule_element_state",
                null
              );
              if (ruleElementStateList && ruleElementStateList.length > 0) {
                const stateList = getStatesAndUpdateStatus(
                  ruleElementStateList,
                  common.getTimestamp()
                );
                const childRuleElementDocId = _.get(
                  rbs,
                  "rule_element_doc_id",
                  null
                );
                const nodeChildObject = {};
                nodeChildObject.type =
                  constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT;
                nodeChildObject.ID = childRuleElementDocId;
                nodeChildObject.isActive = true;
                nodeChildObject.isElementIsRuleBook = _.get(
                  rbs,
                  "rule_element_is_rule_book",
                  null
                );
                nodeChildObject.ruleElementHeaderLevel = _.get(
                  rbs,
                  "rule_element_header_lvl",
                  null
                );
                nodeChildObject.ruleElementRuleBookId = ruleBookId;
                nodeChildObject.title_en = getRuleElementTitle(stateList, "en");
                nodeChildObject.title_de = getRuleElementTitle(stateList, "de");
                array.push(nodeChildObject);
              }
            });
            child = ruleBookIssueElementchild;
          }
        } else if (labelStart === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT) {
          const elementDocId = _.get(
            data,
            "start.properties.rule_element_doc_id",
            null
          );
          const ruleElementchild = _.find(child, {
            rule_element_doc_id: elementDocId,
          }).has_rule_element;
          if (ruleElementchild && ruleElementchild.length > 0) {
            ruleElementchild.forEach((rbs) => {
              // console.log(rbs);
              const ruleElementStateList = _.get(
                rbs,
                "has_rule_element_state",
                null
              );
              if (ruleElementStateList.length > 0) {
                const stateList = getStatesAndUpdateStatus(
                  ruleElementStateList,
                  common.getTimestamp()
                );
                const nodeChildObject = {};
                nodeChildObject.type =
                  constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT;
                nodeChildObject.ID = _.get(rbs, "rule_element_doc_id", null);
                nodeChildObject.isActive = true;
                nodeChildObject.isElementIsRuleBook = _.get(
                  rbs,
                  "rule_element_is_rule_book",
                  null
                );
                nodeChildObject.ruleElementHeaderLevel = _.get(
                  rbs,
                  "rule_element_header_lvl",
                  null
                );
                nodeChildObject.ruleElementRuleBookId = ruleBookId;
                nodeChildObject.title_en = getRuleElementTitle(stateList, "en");
                nodeChildObject.title_de = getRuleElementTitle(stateList, "de");
                array.push(nodeChildObject);
              }
            });
            child = ruleElementchild;
          }
        }
      }
      if (array.length) {
        breadcrumbs.push({ node: array });
      }
    });
  }
  if (remainingSegment.length > 0) {
    remainingSegment.forEach((data, index) => {
      // eslint-disable-next-line operator-assignment
      let id = null;
      const labelEnd = _.get(data, "end.labels[0]", null);
      if (labelEnd) {
        if (labelEnd === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT) {
          id = _.get(data, "end.properties.rule_element_doc_id", null);
        } else if (labelEnd === constants.DRAG_AND_DROP_TYPE.RULE_BOOK) {
          id = _.get(data, "end.properties.rule_book_id", null);
        }
        if (_.get(breadcrumbs, `${index}.node`, []).length > 0) {
          const findObject = _.find(breadcrumbs[index].node, { ID: id });
          if (findObject) {
            if (ruleElementDocId === id) {
              const getIndex = allElements.findIndex((e) => e.ID === id);
              const previous = _.get(allElements, `[${getIndex - 1}]`, null);
              if (previous && !previous.isElementIsRuleBook) {
                otherData.previousRuleElement = _.get(
                  allElements,
                  `[${getIndex - 1}]`,
                  null
                );
              }
              otherData.nextRuleElement = _.get(
                allElements,
                `[${getIndex + 1}]`,
                null
              );
            }
            findObject.isView = true;
          }
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
  const ruleBookIssueNo = params.rule_book_issue_no;
  const ruleElementDocId = params.rule_element_doc_id;
  let breadcrumbs = [];
  const rootNodeChild = [];
  const secondeNodeChild = [];
  let segment = [];
  let response = {};
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
      // console.log(params);
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
        breadcrumbs = await getBreadcrumbs(
          treeStructure.has_rule_book_struct_child,
          segment,
          breadcrumbs
        );
        response.settings = treeStructure.language_preference_settings;
      }
    }

    if (ruleBookId && ruleBookIssueNo) {
      const elementTreeStructure = await getRuleElementStructure(
        ruleBookId,
        ruleBookIssueNo
      );
      const segments = await ruleElementShortestPath(
        ruleBookId,
        ruleElementDocId
      );
      const otherData = {
        nextRuleElement: null,
        previousRuleElement: null,
        ruleBookId,
        ruleElementDocId,
      };
      if (segments) {
        const ruleElementBreadcrumbs = await getElementBreadcrumbs(
          _.get(elementTreeStructure, "rule_book_issue", null),
          segments,
          [],
          otherData
        );
        response = { ...response, ...otherData };
        response.breadcrumbs = _.concat(breadcrumbs, ruleElementBreadcrumbs);
      }
    }
    return response;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  } finally {
    session.close();
  }
};

const getRuleElementStateArticle = (ruleElements) => {
  if (ruleElements && ruleElements.length > 0) {
    const array = ruleElements.map((e) => {
      const r = {
        identity: e.identity,
        rule_element_doc_id: e.rule_element_doc_id,
        rule_element_article_de: null,
        rule_element_article_en: null,
      };
      if (e.res && e.res.length > 0) {
        e.res.forEach((res) => {
          r[`rule_element_article_${res.iso_639_1}`] = res.rule_element_article;
        });
      }
      return r;
    });
    return array;
  }
  return null;
};

const getAMCGMRuleElementFromDB = async (
  viewState,
  isSingle,
  ruleElementDocId,
  identity
) => {
  let status = null;
  const response = { amc: null, gm: null, cs: null, backToRuleElement: null };
  if (!isSingle) {
    status = _.get(viewState, "de.rule_element_status", null);
  } else {
    if (_.get(viewState, "de.rule_element_status", null)) {
      status = _.get(viewState, "de.rule_element_status", null);
    }
    if (_.get(viewState, "en.rule_element_status", null)) {
      status = _.get(viewState, "en.rule_element_status", null);
    }
  }
  if (status !== constants.RULE_ELEMENT_STATE_STATUS.RED) {
    const session = driver.session();
    try {
      const result = await session.run(getAMCGMRuleElementForFE, {
        rule_element_doc_id: ruleElementDocId,
        identity,
      });
      if (result && result.records.length > 0) {
        result.records.forEach((record) => {
          response.amc = getRuleElementStateArticle(record.get("amc"));
          response.gm = getRuleElementStateArticle(record.get("gm"));
          response.cs = getRuleElementStateArticle(record.get("cs"));
        });
      }
    } catch (error) {
      session.close();
      throw error;
    } finally {
      session.close();
    }
  }
  const session = driver.session();
  try {
    const BackToRuleElementResult = await session.run(
      getBackToRuleElementForFE,
      {
        rule_element_doc_id: ruleElementDocId,
        identity,
      }
    );
    if (BackToRuleElementResult && BackToRuleElementResult.records.length > 0) {
      BackToRuleElementResult.records.forEach((record) => {
        response.backToRuleElement = getRuleElementStateArticle(
          record.get("backToRuleElement")
        );
      });
    }
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
  return response;
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
  const hist = _.get(params, "identity", null);
  let isSingle = false;
  let nowDate = common.getTimestamp();
  const identity = [];
  let ruleBookId = null;
  let ruleBookIssueNo = null;
  let ruleElementAMC = null;
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
          record.get("res").forEach((reState, index) => {
            if (
              reState.lang &&
              reState.res &&
              reState.lang.properties.iso_639_1
            ) {
              const properties = _.get(reState, "res.properties", null);
              const stateIdentity = _.get(reState, "res.identity", null);
              const versionOfId = _.get(reState, "version_of_id", index);
              const stateLang = _.get(
                reState,
                "lang.properties.iso_639_1",
                null
              );
              let uniqueKey = "";
              if (properties && stateLang && stateIdentity) {
                if (versionOfId && stateLang === "de") {
                  uniqueKey = `${versionOfId}_${stateIdentity}`;
                } else {
                  uniqueKey = `${stateIdentity}_${versionOfId}`;
                }
                if (properties.rule_element_title !== "") {
                  properties.rule_element_title = common.removeTag(
                    properties.rule_element_title
                  );
                }
                if (!res[uniqueKey]) {
                  res[uniqueKey] = {};
                }
                res[uniqueKey][stateLang] = properties;
                res[uniqueKey][stateLang].identity = _.get(
                  reState,
                  "res.identity",
                  null
                );

                const status = getRuleElementStateStatus(
                  _.cloneDeep(res[uniqueKey][stateLang]),
                  nowDate
                );
                res[uniqueKey][stateLang].rule_element_status = status;
                const solState = _.get(reState, "sls.properties", null);
                if (solState) {
                  const solObject = {
                    sol_state: solState,
                  };
                  res[uniqueKey][stateLang].sol = solObject;
                }
              }
            }
          });
        }
        if (res && Object.keys(res).length > 0) {
          Object.keys(res).forEach((e) => {
            if (hist) {
              const deActive = _.get(res[e], "de.identity", null);
              const enActive = _.get(res[e], "en.identity", null);
              if (enActive === hist || deActive === hist) {
                viewState = res[e];
              }
              if (!enActive || !deActive) {
                isSingle = true;
              }
            }
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
            if (!viewState) {
              if (Object.keys(res[e]).length === 2) {
                const deActive = _.get(res[e], "de.rule_element_status", null);
                const enActive = _.get(res[e], "en.rule_element_status", null);
                if (
                  enActive === constants.RULE_ELEMENT_STATE_STATUS.BLUE &&
                  deActive === constants.RULE_ELEMENT_STATE_STATUS.BLUE
                ) {
                  viewState = res[e];
                }
              } else if (Object.keys(res[e]).length === 1) {
                const deActive = _.get(res[e], "de.rule_element_status", null);
                const enActive = _.get(res[e], "en.rule_element_status", null);
                if (
                  enActive === constants.RULE_ELEMENT_STATE_STATUS.BLUE ||
                  deActive === constants.RULE_ELEMENT_STATE_STATUS.BLUE
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
          rule_element_identity: record.get("re")
            ? record.get("re").identity
            : null,
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
    if (rbResult && rbResult.records.length > 0) {
      const rbRecord = _.get(rbResult, "records[0]", null);
      ruleBookId = rbRecord.get("rule_book_id_2");
      ruleBookIssueNo = rbRecord.get("rule_book_issue_no_2");
      if (!ruleBookId) {
        ruleBookId = rbRecord.get("rule_book_id_1");
        ruleBookIssueNo = rbRecord.get("rule_book_issue_no_1");
      }
      // console.log(rbResult.records);
      // console.log(ruleBookIssueNo);
      if (ruleBookId && ruleBookIssueNo) {
        const breadcrumbsData = await getRuleBookBreadcrumbsByRuleElement(
          object,
          {
            rule_book_id: ruleBookId,
            rule_book_issue_no: ruleBookIssueNo,
            rule_element_doc_id: ruleElementDocId,
          },
          ctx
        );
        settings = breadcrumbsData.settings;
        response.breadcrumbs = breadcrumbsData.breadcrumbs;
        response.previousRuleElement = breadcrumbsData.previousRuleElement;
        response.nextRuleElement = breadcrumbsData.nextRuleElement;
      }
    }
    if (userEmail && viewState) {
      const deIdentity = _.get(viewState, "de.identity", null);
      const enIdentity = _.get(viewState, "en.identity", null);
      if (deIdentity) identity.push(deIdentity);
      if (enIdentity) identity.push(enIdentity);
      if (identity.length > 0) {
        common.loggingData(logRuleElementState, {
          type: constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE,
          current_user_email: userEmail,
          identity,
        });
      }
      // Show duplicate log for history
      // eslint-disable-next-line no-constant-condition
      if (ruleElementDocId && ruleBookId && ruleBookIssueNo && 0) {
        common.loggingData(logRuleElement, {
          type: constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE,
          current_user_email: userEmail,
          rule_element_doc_id: ruleElementDocId,
          rule_book_id: ruleBookId,
          rule_book_issue_no: ruleBookIssueNo,
        });
      }
    }
    if (identity.length > 0) {
      const ruleElementLogResultDetails = await session.run(
        getRuleElementStateDetailsWithLog,
        {
          identity,
        }
      );
      if (
        ruleElementLogResultDetails &&
        ruleElementLogResultDetails.records.length > 0
      ) {
        ruleElementLogResultDetails.records.forEach((record) => {
          const logIdentity = record.get("res").identity;
          const rbis = record.get("rbis");
          const createdLog = record.get("createdLog");
          const updatedLog = record.get("updatedLog");
          const deIdentity = _.get(viewState, "de.identity", null);
          const enIdentity = _.get(viewState, "en.identity", null);
          if (deIdentity === logIdentity) {
            _.set(viewState, "de.rbis", rbis);
            _.set(viewState, "de.createdLog", createdLog);
            _.set(viewState, "de.updatedLog", updatedLog);
          } else if (enIdentity === logIdentity) {
            _.set(viewState, "en.rbis", rbis);
            _.set(viewState, "en.createdLog", createdLog);
            _.set(viewState, "en.updatedLog", updatedLog);
          }
        });
      }
    }
    response.isSingle = isSingle;
    response.view = viewState;
    response.language_preference_settings = settings;
    if (response && response.rule_element_identity) {
      ruleElementAMC = await getAMCGMRuleElementFromDB(
        viewState,
        isSingle,
        ruleElementDocId,
        response.rule_element_identity
      );
    }

    response = {
      ...response,
      ...ruleElementAMC,
    };
    return response;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
