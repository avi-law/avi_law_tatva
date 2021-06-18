const { constants } = require("../utils");

exports.addRuleElementQuery = (queryParams) => {
  let query = `
  MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}"})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.rule_book_issue_no}) })`;

  if (queryParams.rule_element_parent_doc_id) {
    query = `
    ${query}
    MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(rep:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_parent_doc_id}" })
    MERGE (rep)-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element { rule_element_doc_id: "${queryParams.re.rule_element_doc_id}" })`;
  } else if (queryParams.rule_book_issue_no && queryParams.rule_book_id) {
    query = `
    ${query}
    MERGE (rbi)-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element { rule_element_doc_id: "${queryParams.re.rule_element_doc_id}" })`;
  }

  query = `${query}
  FOREACH (_ IN CASE WHEN re IS NOT NULL THEN [1] END | SET re.rule_element_header_lvl = toInteger(${queryParams.re.rule_element_header_lvl}), re.rule_element_is_rule_book = ${queryParams.re.rule_element_is_rule_book} )
  FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order = toInteger(${queryParams.rule_element_order}) )
  RETURN re`;

  return query;
};

exports.updateRuleElementQuery = (queryParams) => {
  const query = `
  MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.rule_book_issue_no}) })
  MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  SET re = $queryParams.re
  RETURN re`;
  return query;
};

exports.logRuleElement = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger($rule_book_issue_no) })
MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]-(re)
`;

exports.logRuleElementState = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (res:Rule_Element_State)
WHERE id(res) IN $identity
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
WITH res, l1
UNWIND res as state
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]-(state)
`;

exports.getRuleElementStateList = `
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})
  CALL {
    WITH re
    MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
    OPTIONAL MATCH (lang)<-[:SOL_STATE_LANGUAGE_IS]-(sls:Sol_State)<-[:HAS_SOL_STATE]-(:Sol)<-[:RULE_ELEMENT_STATE_SOL_IS]-(res)
    OPTIONAL MATCH (res)-[r:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(resv:Rule_Element_State)
    WITH id(resv) as version_of_id, res, sls, lang order by res.rule_element_in_force_from ASC, res.rule_element_in_force_until ASC
    RETURN collect({ res: res, lang: lang, sls: sls, version_of_id: version_of_id }) as res
  }
RETURN re, res
`;

exports.deleteRuleElement = (queryParams) => {
  let query = `
    MATCH (rb:Rule_Book {rule_book_id: "${queryParams.ruleBookId}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.ruleBookIssueNo}) })
  `;
  if (queryParams.ruleElementDocParentId) {
    query = `
    ${query}
    MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(rep:Rule_Element { rule_element_doc_id: "${queryParams.ruleElementDocParentId}" })-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element {rule_element_doc_id: "${queryParams.rule_element_doc_id}" } )
    DELETE r1
    RETURN re;
    `;
  } else {
    query = `
    ${query}
    MATCH (rbi)-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element {rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
    DELETE r1
    RETURN re;
    `;
  }
  return query;
};

exports.getRuleElementStateListNew = `
// MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})
// MATCH (res1:Rule_Element_State {rule_element_doc_id: $rule_element_doc_id })-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(reslang:Language)
// WHERE NOT (res1)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(:Rule_Element_State)
// MATCH path = (res1)-[:HAS_RULE_ELEMENT_SUCCESSOR*]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
// WITH Collect(path)as path_elements, reslang, re
// CALL apoc.convert.toTree(path_elements) yield value
// RETURN value, reslang, re;

// MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]->(res1:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(reslang:Language)
// WHERE NOT (res1)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(:Rule_Element_State)
// WITH DISTINCT res1, re, collect({res1: {}, lang: reslang}) as res

// OPTIONAL MATCH path = (res1)-[:HAS_RULE_ELEMENT_SUCCESSOR*]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
// WITH Collect(path)as path_elements, re, res

// CALL apoc.convert.toTree(path_elements, true, {
//   nodes: {Rule_Element_State: ['rule_element_show_anyway','rule_element_applies_from','rule_element_in_force_until','rule_element_applies_until','rule_element_in_force_from','rule_element_visible_until','rule_element_visible_from','rule_element_title', 'rule_element_article'], Language: ['iso_639_1']}
// }) yield value

MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]->(res1:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(reslang:Language)
WHERE NOT (res1)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(:Rule_Element_State)
WITH res1, collect({ res1: { identity: id(res1), rule_element_title: res1.rule_element_title, rule_element_show_anyway: res1.rule_element_show_anyway,rule_element_applies_from: res1.rule_element_applies_from,rule_element_in_force_until: res1.rule_element_in_force_until,rule_element_applies_until: res1.rule_element_applies_until,rule_element_in_force_from: res1.rule_element_in_force_from,rule_element_visible_until: res1.rule_element_visible_until,rule_element_visible_from: res1.rule_element_visible_from,rule_element_title: res1.rule_element_title, rule_element_article: res1. rule_element_article}, lang: {iso_639_1: reslang.iso_639_1 } }) as res, re
OPTIONAL MATCH path =(res1)-[:HAS_RULE_ELEMENT_SUCCESSOR*]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WITH Collect(path) as path_elements, res, re

CALL apoc.convert.toTree(path_elements, true, {
  nodes: {Rule_Element_State: ['rule_element_id', 'rule_element_title', 'rule_element_show_anyway','rule_element_applies_from','rule_element_in_force_until','rule_element_applies_until','rule_element_in_force_from','rule_element_visible_until','rule_element_visible_from','rule_element_title', 'rule_element_article'], Language: ['iso_639_1']}
}) yield value

RETURN re, res, value

// MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]->(res1:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(reslang:Language)
// WHERE NOT (res1)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(:Rule_Element_State)
// OPTIONAL MATCH path = (res1)-[:HAS_RULE_ELEMENT_SUCCESSOR*]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
// WITH Collect(path)as path_elements, re, collect({res1: res1, lang: reslang}) as res
// CALL apoc.convert.toTree(path_elements, true, {
//   nodes: {Rule_Element_State: ['rule_element_title', 'rule_element_article', 'rule_element_applies_from', 'rule_element_in_force_from'], Language: ['iso_639_1']}
// }) yield value
// RETURN re, res, value
`;

exports.getRuleElementStateListLatest = `
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger($rule_book_issue_no) })
MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]-(lang:Language)
OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(res2:Rule_Element_State)-[r:HAS_RULE_ELEMENT_SUCCESSOR]->(res)
OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(res4:Rule_Element_State)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(res)
OPTIONAL MATCH (solLang:Language)<-[:SOL_STATE_LANGUAGE_IS]-(sls:Sol_State)<-[:HAS_SOL_STATE]-(:Sol)<-[:RULE_ELEMENT_STATE_SOL_IS]-(res)
OPTIONAL MATCH (res)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res3)
WITH collect({sol_name_01: sls.sol_name_01, lang: solLang.iso_639_1}) as sol, res, res2, res3, res4, lang
RETURN collect(
  {
    identity: id(res),
    rule_element_show_anyway: res.rule_element_show_anyway,
    rule_element_applies_from: res.rule_element_applies_from,
    rule_element_in_force_until: res.rule_element_in_force_until,
    rule_element_applies_until: res.rule_element_applies_until,
    rule_element_in_force_from: res.rule_element_in_force_from,
    rule_element_visible_until: res.rule_element_visible_until,
    rule_element_visible_from: res.rule_element_visible_from,
    rule_element_title: res.rule_element_title,
    rule_element_article: res.rule_element_article,
    rule_element_id: res.rule_element_id,
    rule_element_successor_identity: id(res2),
    rule_element_state_language_version_identity: id(res3),
    rule_element_state_langauge: lang.iso_639_1,
    has_successor_identity: id(res4),
    sol: sol
  }) as res
`;

const dropChangeOrderQuery = (queryParams) => {
  let query = ``;
  if (
    queryParams.drop_rule_element_order &&
    queryParams.drop_rule_element_order.length > 0
  ) {
    if (
      queryParams.drop_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
      ${query}
      UNWIND $queryParams.drop_rule_element_order as ruleElementDrop
      OPTIONAL MATCH (rbDrop:Rule_Book {rule_book_id: "${queryParams.rule_book_id}"})-[:HAS_RULE_BOOK_ISSUE]->(rbiDrop:Rule_Book_Issue {rule_book_issue_no: ${queryParams.rule_book_issue_no} })-[r1:HAS_RULE_ELEMENT]->(reDrop:Rule_Element {rule_element_doc_id: ruleElementDrop.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order = toInteger(ruleElementDrop.rule_element_order) )
      RETURN reDrop as re`;
    } else {
      query = `
      ${query}
      UNWIND $queryParams.drop_rule_element_order as ruleElementDrop
      OPTIONAL MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(repDrop:Rule_Element { rule_element_doc_id: ruleElementDrop.rule_element_parent_doc_id})-[r1:HAS_RULE_ELEMENT]->(reDrop:Rule_Element { rule_element_doc_id: ruleElementDrop.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order = toInteger(ruleElementDrop.rule_element_order) )
      RETURN reDrop as re`;
    }
  }
  return query;
};

const dragChangeOrderQuery = (queryParams) => {
  let query = ``;
  if (
    queryParams.drag_rule_element_order &&
    queryParams.drag_rule_element_order.length > 0
  ) {
    if (
      queryParams.drag_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
      ${query}
      UNWIND $queryParams.drag_rule_element_order as ruleElementDrag
      OPTIONAL MATCH (rbDrop:Rule_Book {rule_book_id: "${queryParams.rule_book_id}"})-[:HAS_RULE_BOOK_ISSUE]->(rbiDrop:Rule_Book_Issue {rule_book_issue_no: ${queryParams.rule_book_issue_no} })-[r2:HAS_RULE_ELEMENT]->(reDrag:Rule_Element {rule_element_doc_id: ruleElementDrag.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | SET r2.order = toInteger(ruleElementDrag.rule_element_order) )
      WITH *`;
    } else {
      query = `
      ${query}
      UNWIND $queryParams.drag_rule_element_order as ruleElementDrag
      OPTIONAL MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(repDrop:Rule_Element { rule_element_doc_id: ruleElementDrag.rule_element_parent_doc_id})-[r2:HAS_RULE_ELEMENT]->(reDrop:Rule_Element { rule_element_doc_id: ruleElementDrag.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | SET r2.order = toInteger(ruleElementDrag.rule_element_order) )
      WITH *
      `;
    }
  }
  return query;
};

exports.changeRuleElementOrderQuery = (queryParams) => {
  let query = `MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.rule_book_issue_no}) })`;
  if (queryParams.isInternalChangeOrder) {
    query = `
    ${query}
    ${dropChangeOrderQuery(queryParams)}`;
  } else {
    // Remove relation between drag node and drag parent node
    if (
      queryParams.drag_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT
    ) {
      query = `
        ${query}
        OPTIONAL MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(rep_drag:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_parent_doc_id}" })-[r1_drag:HAS_RULE_ELEMENT]->(re_drag:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        WITH *`;
    } else if (
      queryParams.drag_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
        ${query}
        OPTIONAL MATCH(rb_drag:Rule_Book { rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi_drag:Rule_Book_Issue { rule_book_issue_no: ${queryParams.rule_book_issue_no} })-[r1_drag:HAS_RULE_ELEMENT]->(reDrop:Rule_Element {rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        WITH *`;
    }
    // Create relation between drag node and drop parent node
    if (
      queryParams.drop_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT
    ) {
      query = `
        ${query}
        MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(rep_drop:Rule_Element { rule_element_doc_id: "${queryParams.drop_rule_element_parent_doc_id}" })
        MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re_drop:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        FOREACH (_ IN CASE WHEN re_drop IS NOT NULL AND rep_drop IS NOT NULL THEN [1] END | MERGE (rep_drop)-[:HAS_RULE_ELEMENT]->(re_drop) )
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        WITH *`;
    } else if (
      queryParams.drop_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
        ${query}
        OPTIONAL MATCH (rb_drag:Rule_Book { rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi_drag:Rule_Book_Issue { rule_book_issue_no: ${queryParams.rule_book_issue_no} })
        OPTIONAL MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re_drag_el:Rule_Element {rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        WITH *
        FOREACH (_ IN CASE WHEN rbi_drag IS NOT NULL AND re_drag_el IS NOT NULL THEN [1] END | MERGE (rbi_drag)-[:HAS_RULE_ELEMENT]->(re_drag_el))
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        WITH re_drag_el, rbi_drag as rbi`;
    }
    query = `
      ${query}
      ${dragChangeOrderQuery(queryParams)}
      ${dropChangeOrderQuery(queryParams)}
      `;
  }
  return query;
};

exports.addRuleElementStateQuery = (queryParams) => {
  let query = `
  MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.rule_book_issue_no}) })
  MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;

  if (queryParams.isValidDE) {
    query = `${query}
    OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]-(res_s_de2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
    WHERE NOT (res_s_de2)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
    CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
    FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
    FOREACH (_ IN CASE WHEN res_s_de2 IS NOT NULL THEN [1] END | MERGE (res_s_de2)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(res_de))
    WITH res_de, re, lang1, lang2`;
    if (queryParams.sol_de) {
      query = `${query}
      OPTIONAL MATCH (sol_de:Sol {sol_id: ${queryParams.sol_de}})
      FOREACH (_ IN CASE WHEN sol_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_de) )
      WITH res_de, re, lang1, lang2`;
    }
  }

  if (queryParams.isValidEN) {
    query = `${query}
    OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]-(res_s_en1:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
    WHERE NOT (res_s_en1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
    CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
    FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )
    FOREACH (_ IN CASE WHEN res_s_en1 IS NOT NULL THEN [1] END | MERGE (res_s_en1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(res_en))`;

    if (queryParams.isValidEN && queryParams.isValidDE) {
      query = `${query}
      WITH res_de, res_en, re, lang1, lang2
      FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_de))
      FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_en))`;
    }

    if (queryParams.isValidEN && queryParams.isValidDE) {
      query = `${query}
      WITH res_de, res_en, re, lang1, lang2`;
    } else {
      query = `${query}
      WITH res_en, re, lang1, lang2`;
    }

    if (queryParams.sol_en) {
      query = `${query}
      OPTIONAL MATCH (sol_en:Sol {sol_id: ${queryParams.sol_en}})
      FOREACH (_ IN CASE WHEN sol_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_en) )`;
    }
    if (queryParams.isValidEN && queryParams.isValidDE) {
      query = `${query}
      WITH res_de, res_en, re`;
    } else {
      query = `${query}
      WITH res_en, re`;
    }
  }

  if (queryParams.isValidEN && queryParams.isValidDE) {
    query = `${query}
    RETURN res_de, res_en, re`;
  } else if (queryParams.isValidEN) {
    query = `${query}
    RETURN res_en, re`;
  } else if (queryParams.isValidDE) {
    query = `${query}
    RETURN res_de, re`;
  } else {
    query = `${query}
    RETURN re`;
  }
  return query;
};

exports.updateRuleElementStateQuery = (queryParams) => {
  let query = `
  MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.rule_book_issue_no}) })
  MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;

  if (queryParams.isValidDE) {
    if (queryParams.res.de.identity) {
      query = `${query}
      OPTIONAL MATCH (res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      WHERE id(res_de) = $queryParams.res.de.identity
      FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
      WITH res_de, lang1, lang2, re`;
    } else if (false) {
      // Remove if because cannot able to add state between
      query = `${query}
      OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(resDe:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      WHERE NOT (resDe)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
      WITH res_de, lang1, lang2, re, resDe
      CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
      FOREACH (_ IN CASE WHEN resDe IS NOT NULL THEN [1] END | MERGE (res_de)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(resDe) )
      WITH res_de, lang1, lang2, re`;
    }
    if (queryParams.sol_de) {
      query = `${query}
      OPTIONAL MATCH (res_de)-[r1:RULE_ELEMENT_STATE_SOL_IS]->()
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | DELETE r1)
      WITH res_de, lang1, lang2, re
      OPTIONAL MATCH (sol_de:Sol {sol_id: ${queryParams.sol_de}})
      FOREACH (_ IN CASE WHEN sol_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_de))`;
    }
  }

  if (queryParams.isValidDE) {
    query = `${query}
    WITH res_de, lang1, lang2, re`;
  } else {
    query = `${query}
    WITH re, lang1, lang2`;
  }

  if (queryParams.isValidEN) {
    if (queryParams.res.en.identity) {
      query = `${query}
      OPTIONAL MATCH (res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      WHERE id(res_en) = $queryParams.res.en.identity
      FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )`;
    } else if (false) {
      // Remove if because cannot able to add state between
      query = `${query}
      OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(resEn:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      WHERE NOT (resEn)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
      CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )
      FOREACH (_ IN CASE WHEN resEn IS NOT NULL THEN [1] END | MERGE (res_en)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(resEn))`;
    }

    if (queryParams.isValidDE) {
      query = `${query}
      WITH res_en, re, res_de, lang1, lang2`;
    } else {
      query = `${query}
      WITH res_en, re, lang1, lang2`;
    }

    if (queryParams.sol_en) {
      query = `${query}
      OPTIONAL MATCH (res_en)-[r2:RULE_ELEMENT_STATE_SOL_IS]->()
      FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | DELETE r2)`;
      if (queryParams.isValidDE) {
        query = `${query}
        WITH res_en, re, res_de, lang1, lang2`;
      } else {
        query = `${query}
        WITH res_en, re, lang1, lang2`;
      }
      query = `${query}
      OPTIONAL MATCH (sol_en:Sol {sol_id: ${queryParams.sol_en}})
      FOREACH (_ IN CASE WHEN sol_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_en))`;
    }
    if (queryParams.isValidDE) {
      query = `${query}
      WITH res_en, re, res_de, lang1, lang2`;
    } else {
      query = `${query}
      WITH res_en, re, lang1, lang2`;
    }
  }
  if (queryParams.isValidEN && queryParams.isValidDE) {
    query = `${query}
    OPTIONAL MATCH (res_en)-[en_v1:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->()
    OPTIONAL MATCH (res_de)-[de_v1:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->()
    DELETE en_v1, de_v1
    WITH res_en, re, res_de
    FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_de))
    FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_en))
    WITH res_en, re, res_de
    `;
  }

  if (queryParams.isValidEN && queryParams.isValidDE) {
    query = `${query}
    RETURN res_de, res_en, re`;
  } else if (queryParams.isValidEN) {
    query = `${query}
    RETURN res_en, re`;
  } else if (queryParams.isValidDE) {
    query = `${query}
    RETURN res_de, re`;
  } else {
    query = `${query}
    RETURN re`;
  }

  return query;
};

exports.updateHiTechRuleElementStateQuery = (queryParams) => {
  let query = `
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;

  if (queryParams.isValidDE) {
    if (queryParams.res.de.identity) {
      query = `${query}
      OPTIONAL MATCH (res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      WHERE id(res_de) = $queryParams.res.de.identity
      FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
      WITH res_de, lang1, lang2`;
    }
  }

  if (queryParams.isValidEN) {
    if (queryParams.res.en.identity) {
      query = `${query}
      OPTIONAL MATCH (res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      WHERE id(res_en) = $queryParams.res.en.identity
      FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )`;
    }

    if (queryParams.isValidDE) {
      query = `${query}
      WITH res_en, res_de, lang1, lang2`;
    } else {
      query = `${query}
      WITH res_en, lang1, lang2`;
    }
  }

  if (queryParams.isValidEN && queryParams.isValidDE) {
    query = `${query}
    RETURN res_de, res_en`;
  } else if (queryParams.isValidEN) {
    query = `${query}
    RETURN res_en`;
  } else if (queryParams.isValidDE) {
    query = `${query}
    RETURN res_de`;
  } else {
    query = `${query}
    RETURN lang1, lang2`;
  }

  return query;
};

exports.getPredecessor = (queryParams) => {
  let query = `
  MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.rule_book_issue_no}) })
  MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]-(res:Rule_Element_State)`;
  if (queryParams.isUpdate) {
    query = `${query}
    WHERE id(res) = ${queryParams.identity}
    OPTIONAL MATCH (res)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(res_success:Rule_Element_State)
    OPTIONAL MATCH (res_success)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_version:Rule_Element_State)
    RETURN collect(id(res_success)) as ids1, collect(id(res_version)) as ids2
    `;
  } else {
    query = `${query}
    WHERE NOT (res)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
    RETURN collect(id(res)) as ids
    `;
  }
  return query;
};

exports.addPredecessorDate = (queryParams) => {
  let query = `
  MATCH (res:Rule_Element_State)
  WHERE id(res) IN $queryParams.identity
  UNWIND res as state
  `;
  if (queryParams.ruleElementAppliesUntilPredecessorDate) {
    query = `${query}
    FOREACH (_ IN CASE WHEN state IS NOT NULL THEN [1] END | SET state.rule_element_applies_until = $queryParams.ruleElementAppliesUntilPredecessorDate)`;
  }
  if (queryParams.ruleElementInForceUntilPredecessorDate) {
    query = `${query}
    FOREACH (_ IN CASE WHEN state IS NOT NULL THEN [1] END | SET state.rule_element_in_force_until = $queryParams.ruleElementInForceUntilPredecessorDate)`;
  }
  query = `${query}
  RETURN res`;
  return query;
};

exports.getRuleElementStateDetails = `
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]-(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WHERE id(res) IN $array_of_identity
OPTIONAL MATCH (res)-[:RULE_ELEMENT_STATE_SOL_IS]->(sl:Sol)
RETURN res, lang, sl
`;

exports.getHitechRuleElementStateDetails = `
MATCH (res1:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1:Language)
WHERE id(res1) = $identity AND (res1.rule_element_hitech = TRUE OR res1.rule_element_hitech IS NULL )
OPTIONAL MATCH(res1)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2:Language)
RETURN { res: res1, lang: { iso_639_1: lang1.iso_639_1 } } as res1, { res: res2, lang: { iso_639_1: lang2.iso_639_1 } } as res2
`;

exports.deleteRuleElementState = `
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger($rule_book_issue_no) })
MATCH (rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element)-[r1:HAS_RULE_ELEMENT_STATE]->(res1:Rule_Element_State)
WHERE re.rule_element_doc_id = $rule_element_doc_id AND id(res1) IN $identities AND NOT (res1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
OPTIONAL MATCH(res1)<-[r2:HAS_RULE_ELEMENT_SUCCESSOR]-(res2:Rule_Element_State)
OPTIONAL MATCH(res1)-[r3:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(:Rule_Element_State)
OPTIONAL MATCH(res1)<-[r4:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]-(:Rule_Element_State)
WITH res1, r1, r2, res2, r3, r4
FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | DELETE r1)
FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | DELETE r2)
FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | DELETE r3)
FOREACH (_ IN CASE WHEN r4 IS NOT NULL THEN [1] END | DELETE r4)
RETURN DISTINCT res1,res2
`;

exports.getSolTagForRuleElement = (queryOrderBy) => `
MATCH (rb:Rule_Book { rule_book_id: $rule_book_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger($rule_book_issue_no) })
MATCH (rbi)-[:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->(sl)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
WITH sl, lang, sls order by ${queryOrderBy}
RETURN distinct sl.sol_id as sol_id, sl.sol_date as sol_date ,collect({ sls: {sol_name_01: sls.sol_name_01}, lang: { iso_639_1: lang.iso_639_1}}) as sls
`;

exports.getRuleBookIDByRuleElement = `
OPTIONAL MATCH (rb_1:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi_1:Rule_Book_Issue)-[r1:HAS_RULE_ELEMENT]->(re1_1:Rule_Element)
WHERE re1_1.rule_element_doc_id = $rule_element_doc_id
OPTIONAL MATCH (rb_2:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi_2:Rule_Book_Issue)-[r2:HAS_RULE_ELEMENT]->(re1_2:Rule_Element)-[:HAS_RULE_ELEMENT*]->(re2_2:Rule_Element)
WHERE re2_2.rule_element_doc_id = $rule_element_doc_id
RETURN rb_1.rule_book_id as rule_book_id_1, rb_2.rule_book_id as rule_book_id_2, rbi_1.rule_book_issue_no as rule_book_issue_no_1, rbi_2.rule_book_issue_no as rule_book_issue_no_2
ORDER BY rbi_1.rule_book_issue_no DESC, rbi_2.rule_book_issue_no DESC
LIMIT 1
`;

exports.getRuleElementStateDetailsWithLog = `
MATCH (res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WHERE id(res) IN $identity
OPTIONAL MATCH (res)<-[:HAS_RULE_ELEMENT_STATE]-(re:Rule_Element)<-[r1:HAS_RULE_ELEMENT*]-(rbi:Rule_Book_Issue)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang)
CALL {
  WITH res
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.CREATE_RULE_ELEMENT_AND_STATE}})
  OPTIONAL MATCH (res)<-[:LOG_REFERS_TO_OBJECT]-(l1:Log)-[:HAS_LOG_TYPE]->(lt)
  OPTIONAL MATCH (l1)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  // RETURN collect({timestamp: l1.log_timestamp, user_state: {user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name} }) AS createdLog
  WITH us1, l1 order by l1.log_timestamp DESC
  RETURN {timestamp: l1.log_timestamp, user_state: {user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name} } AS createdLog
  LIMIT 1
}
CALL {
  WITH res
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.UPDATE_RULE_ELEMENT_AND_STATE}})
  OPTIONAL MATCH (res)<-[:LOG_REFERS_TO_OBJECT]-(l2:Log)-[:HAS_LOG_TYPE]->(lt)
  OPTIONAL MATCH (l2)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  // RETURN collect({timestamp: l2.log_timestamp, user_state: { user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name  } }) AS updatedLog
  WITH  us1, l2 order by l2.log_timestamp DESC
  RETURN {timestamp: l2.log_timestamp, user_state: { user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name  } } AS updatedLog
  LIMIT 1
}
RETURN res, updatedLog, createdLog, { rule_book_issue_title_short: rbis.rule_book_issue_title_short } as rbis
`;

exports.getRuleElementShortestPath = `
MATCH (rb:Rule_Book),(re:Rule_Element),
p = shortestPath((rb)-[:HAS_RULE_BOOK_ISSUE|HAS_RULE_ELEMENT*..15]-(re))
WHERE rb.rule_book_id = $rule_book_id AND re.rule_element_doc_id = $rule_element_doc_id
RETURN p
`;

exports.getHitechRuleElementCount = (condition = "") => `
MATCH (re:Rule_Element)-[r1:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)
${condition}
RETURN count (distinct re) as count`;

exports.getHitechRuleElementList = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "id(res) DESC"
) => `
MATCH (res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
${condition}
WITH res, lang order by ${orderBy}
RETURN { res: { identity: id(res),rule_element_title: res.rule_element_title, rule_element_show_anyway: res.rule_element_show_anyway,rule_element_applies_from: res.rule_element_applies_from,rule_element_in_force_until: res.rule_element_in_force_until,rule_element_applies_until: res.rule_element_applies_until,rule_element_in_force_from: res.rule_element_in_force_from,rule_element_visible_until: res.rule_element_visible_until,rule_element_visible_from: res.rule_element_visible_from,rule_element_title: res.rule_element_title, rule_element_article: res. rule_element_article }, lang: {iso_639_1: lang.iso_639_1 } } as res
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.getRuleElementBackLinks = `
MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element)-[:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WHERE res.rule_element_text CONTAINS  $rule_element_doc_id AND rb.rule_book_active = TRUE
OPTIONAL MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang)
RETURN collect({ rule_element_doc_id: re.rule_element_doc_id , iso_639_1: lang.iso_639_1, rule_book_issue_title_short: rbis.rule_book_issue_title_short, rule_element_article: res.rule_element_article}) as res
`;
