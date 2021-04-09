/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  changeOrderQuery,
  logRulebook,
} = require("../../../neo4j/rule-book-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  const dragAndDropPermission = constants.CHANGE_RULE_BOOK_ORDER_PERMISSION;
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
      changeOrderData.drag_rule_book_struct_parent_id &&
      changeOrderData.drop_rule_book_struct_parent_id &&
      changeOrderData.drop_rule_book_struct_parent_id ===
        changeOrderData.drag_rule_book_struct_parent_id
    ) {
      isInternalChangeOrder = true;
    }
    if (
      changeOrderData.drag_rule_book_parent_id &&
      changeOrderData.drop_rule_book_parent_id &&
      changeOrderData.drop_rule_book_parent_id ===
        changeOrderData.drag_rule_book_parent_id
    ) {
      isInternalChangeOrder = true;
    }
    if (
      changeOrderData.drag_type === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      if (
        !changeOrderData.drag_rule_book_parent_id ||
        !changeOrderData.drop_rule_book_parent_id
      ) {
        console.log("Required rule book parent id");
        throw new APIError({
          lang: userSurfLang,
          message: "INVALID_DROP_NODE",
        });
      } else if (
        changeOrderData.drag_rule_book_parent_id ===
        changeOrderData.drop_rule_book_parent_id
      ) {
        console.log("Internal rule book issue not dropable");
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
    console.log(changeOrderQuery(queryParams));
    const result = await session.run(changeOrderQuery(queryParams), {
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
        type: constants.LOG_TYPE_ID.UPDATE_RULE_BOOK,
        current_user_email: userEmail,
        rule_book_id: rulebooks[0].rule_book_id || null,
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
