/* eslint-disable no-param-reassign */
const _ = require("lodash");
const { common, constants } = require("../../../utils");

const convertDateToNeo4jFields = [
  "rule_element_applies_from",
  "rule_element_in_force_until",
  "rule_element_applies_until",
  "rule_element_in_force_from",
  "rule_element_visible_until",
  "rule_element_visible_from",
];

const showAnyway = (ruleElementShowAnyway) => {
  let status = constants.RULE_ELEMENT_STATE_STATUS.RED;
  // show_anyway = TRUE
  if (ruleElementShowAnyway) {
    status = constants.RULE_ELEMENT_STATE_STATUS.GREEN;
  }
  // show_anyway = FALSE
  if (!ruleElementShowAnyway) {
    status = constants.RULE_ELEMENT_STATE_STATUS.RED;
  }
  return status;
};

const setRuleElementInForceUntil = (ruleElementState) => {
  const nowDate = common.getTimestamp();

  const ruleElementAppliesFrom = _.get(
    ruleElementState,
    "rule_element_applies_from",
    null
  );
  const ruleElementAppliesUntil = _.get(
    ruleElementState,
    "rule_element_applies_until",
    null
  );
  const ruleElementShowAnyway = _.get(
    ruleElementState,
    "rule_element_show_anyway",
    false
  );

  // applies_from = NULL
  if (!ruleElementAppliesFrom) {
    return showAnyway(ruleElementShowAnyway);
  }

  // applies_from <= Now
  if (ruleElementAppliesFrom <= nowDate) {
    // applies_until >= Now or NULL
    if (!ruleElementAppliesUntil || ruleElementAppliesUntil >= nowDate) {
      return constants.RULE_ELEMENT_STATE_STATUS.GREEN;
    }
    // applies_until < Now
    if (ruleElementAppliesUntil < nowDate) {
      return showAnyway(ruleElementShowAnyway);
    }
  }

  // applies_from > Now
  if (ruleElementAppliesFrom > nowDate) {
    return constants.RULE_ELEMENT_STATE_STATUS.BLUE;
  }

  return constants.RULE_ELEMENT_STATE_STATUS.BLUE;
};

const notSetRuleElementVisibleFrom = (ruleElementState) => {
  const nowDate = common.getTimestamp();
  const ruleElementInForceFrom = _.get(
    ruleElementState,
    "rule_element_in_force_from",
    null
  );
  const ruleElementInForceUntil = _.get(
    ruleElementState,
    "rule_element_in_force_until",
    null
  );
  // in_force_from > Now or NULL
  if (!ruleElementInForceFrom || ruleElementInForceFrom > nowDate) {
    return constants.RULE_ELEMENT_STATE_STATUS.BLUE;
  }
  // in_force_from <= Now
  if (ruleElementInForceFrom <= nowDate) {
    // in_force_until > Now or NULL
    if (!ruleElementInForceUntil || ruleElementInForceUntil > nowDate) {
      const ruleElementAppliesFrom = _.get(
        ruleElementState,
        "rule_element_applies_from",
        null
      );
      // applies_from <= Now or NULL
      if (!ruleElementAppliesFrom || ruleElementAppliesFrom <= nowDate) {
        return constants.RULE_ELEMENT_STATE_STATUS.GREEN;
      }

      // applies_from > Now
      if (ruleElementAppliesFrom > nowDate) {
        return constants.RULE_ELEMENT_STATE_STATUS.GREEN_BLUE;
      }
    }
    // in_force_until <= Now
    if (ruleElementInForceUntil <= nowDate) {
      return setRuleElementInForceUntil(ruleElementState);
    }
  }
  return constants.RULE_ELEMENT_STATE_STATUS.BLUE;
};

module.exports = (ruleElementState) => {
  const nowDate = common.getTimestamp();
  convertDateToNeo4jFields.forEach((element) => {
    if (ruleElementState[element]) {
      ruleElementState[element] = common.getTimestamp(
        ruleElementState[element]
      );
    }
  });
  const ruleElementVisibleFrom = _.get(
    ruleElementState,
    "rule_element_visible_from",
    null
  );
  const ruleElementVisibleUntil = _.get(
    ruleElementState,
    "rule_element_visible_until",
    null
  );
  // visible_from = NULL
  if (!ruleElementVisibleFrom) {
    return notSetRuleElementVisibleFrom(ruleElementState);
  }
  // visible_from <= NOW
  if (ruleElementVisibleFrom <= nowDate) {
    // visible_until > NOW or NULL
    if (!ruleElementVisibleUntil || ruleElementVisibleUntil > nowDate) {
      return constants.RULE_ELEMENT_STATE_STATUS.GREEN;
    }
    return constants.RULE_ELEMENT_STATE_STATUS.GREEN;
  }
  // visible_from > NOW
  return constants.RULE_ELEMENT_STATE_STATUS.BLUE;
};
