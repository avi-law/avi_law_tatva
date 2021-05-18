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
} = require("../../../neo4j/rule-element-query");
const { defaultLanguage } = require("../../../config/application");
const getRuleElementStateStatus = require("./get-rule-element-state-status");

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

    return response;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
