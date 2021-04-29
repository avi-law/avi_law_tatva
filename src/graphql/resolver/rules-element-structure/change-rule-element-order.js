/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  changeRuleElementOrderQuery,
  logRuleElement,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  const dragAndDropPermission = constants.CHANGE_RULE_ELEMENT_ORDER_PERMISSION;
  let isInternalChangeOrder = false;
  params = JSON.parse(JSON.stringify(params));
  const changeOrderData = params.change_order;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const dragType = changeOrderData.drag_type;
    const dropParentType = changeOrderData.drop_parent_type;
    const isAllow = dragAndDropPermission[dragType][dropParentType]
      ? dragAndDropPermission[dragType][dropParentType]
      : false;
    if (!isAllow) {
      throw new APIError({
        lang: userSurfLang,
        message: "INVALID_DROP_NODE",
      });
    }
    if (
      changeOrderData.drop_parent_type &&
      changeOrderData.drag_parent_type &&
      changeOrderData.drop_parent_type ===
        constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE &&
      changeOrderData.drag_parent_type ===
        constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      isInternalChangeOrder = true;
    }
    if (
      changeOrderData.drag_rule_element_parent_doc_id &&
      changeOrderData.drop_rule_element_parent_doc_id &&
      changeOrderData.drag_rule_element_parent_doc_id ===
        changeOrderData.drop_rule_element_parent_doc_id
    ) {
      isInternalChangeOrder = true;
    }
    if (
      changeOrderData.drop_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      if (
        !changeOrderData.rule_book_id ||
        !changeOrderData.rule_book_issue_no
      ) {
        console.log("Required rule book issue details");
        throw new APIError({
          lang: userSurfLang,
          message: "INVALID_DROP_NODE",
        });
      }
    }

    const queryParams = {
      ...changeOrderData,
      isInternalChangeOrder,
    };
    console.log(queryParams);
    console.log(changeRuleElementOrderQuery(queryParams));
    return true;
    const result = await session.run(changeRuleElementOrderQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      const rulebooks = result.records.map((record) => {
        const rulebookResult = {
          ...common.getPropertiesFromRecord(record, "rb"),
        };
        return rulebookResult;
      });
      console.log(rulebooks);
      /**
       const rulebooks = result.records.map((record) => {
        const rulebookResult = {
          ...common.getPropertiesFromRecord(record, "rb"),
        };
        return rulebookResult;
      });
      common.loggingData(logRulebook, {
        type: constants.LOG_TYPE_ID.UPDATE_RULE_element,
        current_user_email: userEmail,
        rule_element_id: rulebooks[0].rule_element_id || null,
      });
      */
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
