/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const { getRuleBooksStructure } = require("../../../neo4j/tree-query");
const { frontendURL } = require("../../../config/application");

const generateRuleBookTreeStructure = (ruleBookList) => {
  const idMapping = ruleBookList.reduce((acc, el, i) => {
    acc[el.rule_book_id] = i;
    return acc;
  }, {});

  let treeStructure;
  ruleBookList.forEach((el) => {
    const stateData = _.cloneDeep(el.res_rbi);
    delete el.res_rbi;
    el.has_rule_book_issue_state = {};
    stateData.forEach((stateElement) => {
      if (stateElement.language) {
        el.has_rule_book_issue_state[stateElement.language] = {
          ...stateElement,
          rule_book_language_is: [
            {
              iso_639_1: stateElement.language,
            },
          ],
        };
      }
    });
    if (el.has_rule_book_issue_state) {
      if (el.has_rule_book_issue_state.en && !el.has_rule_book_issue_state.de) {
        el.has_rule_book_issue_state.de = _.cloneDeep(
          el.has_rule_book_issue_state.en
        );
        if (el.has_rule_book_issue_state.de.title_short) {
          el.has_rule_book_issue_state.de.title_short = `<img src="${frontendURL}assets/images/EN.jpg" alt="EN"> ${el.has_rule_book_issue_state.de.title_short}`;
        }
      } else if (
        !el.has_rule_book_issue_state.en &&
        el.has_rule_book_issue_state.de
      ) {
        el.has_rule_book_issue_state.en = _.cloneDeep(
          el.has_rule_book_issue_state.de
        );
        if (el.has_rule_book_issue_state.en.title_short) {
          el.has_rule_book_issue_state.en.title_short = `<img src="${frontendURL}assets/images/GER.jpg" alt="GER"> ${el.has_rule_book_issue_state.en.title_short}`;
        }
      }
    }
    // Handle the root element
    if (el.rule_book_parent_id === null) {
      treeStructure = el;
      return;
    }
    // Use our mapping to locate the parent element in our data array
    const parentEl = ruleBookList[idMapping[el.rule_book_parent_id]];
    // Add our current el to its parent's `children` array
    parentEl.has_rule_book_child = [
      ...(parentEl.has_rule_book_child || []),
      el,
    ];
  });
  return treeStructure;
};

const generateTreeStructure = (ruleBookStructureList) => {
  const idMapping = ruleBookStructureList.reduce((acc, el, i) => {
    acc[el.rule_book_struct_id] = i;
    return acc;
  }, {});

  let treeStructure;
  ruleBookStructureList.forEach((el) => {
    const stateData = _.cloneDeep(el.res_desc_lang);
    delete el.res_desc_lang;
    el.rule_book =
      el.rbs_res.length > 0 ? generateRuleBookTreeStructure(el.rbs_res) : [];
    el.has_rule_book_struct_state = {};
    stateData.forEach((stateElement) => {
      if (stateElement.language) {
        el.has_rule_book_struct_state[stateElement.language] = {
          rule_book_struct_desc: stateElement.rule_book_struct_desc,
          rule_book_struct_language_is: [
            {
              iso_639_1: stateElement.language,
            },
          ],
        };
      }
    });

    // Handle the root element
    if (el.rule_book_struct_parent_id === null) {
      treeStructure = el;
      return;
    }
    // Use our mapping to locate the parent element in our data array
    const parentEl =
      ruleBookStructureList[idMapping[el.rule_book_struct_parent_id]];
    // Add our current el to its parent's `children` array
    parentEl.has_rule_book_struct_child = [
      ...(parentEl.has_rule_book_struct_child || []),
      el,
    ];
  });
  return treeStructure;
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  let ruleBookStructureList = [];
  let settings = null;
  try {
    const result = await session.run(getRuleBooksStructure);
    ruleBookStructureList = result.records.map((record) => {
      const bookResult = {
        ...record.get("rbss_res"),
        rbs_res: record.get("rbs_res"),
      };
      return bookResult;
    });
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
    // const finalTree = generateTreeStructure(ruleBookStructureList);
    return {
      ...generateTreeStructure(ruleBookStructureList),
      language_preference_settings: settings,
    };
  } catch (error) {
    session.close();
    throw error;
  }
};
