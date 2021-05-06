const { constants } = require("../utils");

exports.addRuleElementQuery = (queryParams) => {
  let query = ``;

  if (queryParams.rule_element_parent_doc_id) {
    query = `MATCH (rep:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_parent_doc_id}" })`;
  } else if (queryParams.rule_book_issue_no && queryParams.rule_book_id) {
    query = `MATCH (rb:Rule_Book {rule_book_id: "${queryParams.rule_book_id}"})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: ${queryParams.rule_book_issue_no} })`;
  }

  query = `
  ${query}
  MERGE (re:Rule_Element { rule_element_doc_id: "${queryParams.re.rule_element_doc_id}" })
  SET re.rule_element_header_lvl = ${queryParams.re.rule_element_header_lvl}, re.rule_element_is_rule_book = ${queryParams.re.rule_element_is_rule_book}`;

  if (queryParams.rule_element_parent_doc_id) {
    query = `${query}
    MERGE (re)<-[:HAS_RULE_ELEMENT {order: ${queryParams.rule_element_order}.0 }]-(rep)
    RETURN re`;
  } else if (queryParams.rule_book_issue_no && queryParams.rule_book_id) {
    query = `${query}
    MERGE (re)<-[:HAS_RULE_ELEMENT {order: ${queryParams.rule_element_order}.0 }]-(rbi)
    RETURN re`;
  }
  return query;
};

exports.updateRuleElementQuery = (queryParams) => {
  const query = `
  MERGE (re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  SET re = $queryParams.re
  RETURN re`;
  return query;
};

exports.logRuleElement = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]-(re)
`;

exports.getRuleElementStateList = `
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})
CALL {
WITH re
  MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
  WITH res, lang order by id(res)
  RETURN collect({ res: res, lang: lang }) as res
}
RETURN re, res;
`;

exports.deleteRuleElement = (queryParams) => {
  let query = "";
  if (queryParams.ruleElementDocParentId) {
    query = `MATCH (rep:Rule_Element { rule_element_doc_id: "${queryParams.ruleElementDocParentId}" })-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element {rule_element_doc_id: "${queryParams.rule_element_doc_id}" } )
    DELETE r1
    RETURN re;
    `;
  } else if (queryParams.ruleBookIssueNo && queryParams.ruleBookId) {
    query = `MATCH (rb:Rule_Book {rule_book_id: "${queryParams.ruleBookId}"})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: ${queryParams.ruleBookIssueNo} })-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element {rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
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
WITH res1, collect({ res1: { identity: id(res1), rule_elemnet_title: res1.rule_elemnet_title, rule_element_show_anyway: res1.rule_element_show_anyway,rule_element_applies_from: res1.rule_element_applies_from,rule_element_in_force_until: res1.rule_element_in_force_until,rule_element_applies_until: res1.rule_element_applies_until,rule_element_in_force_from: res1.rule_element_in_force_from,rule_element_visible_until: res1.rule_element_visible_until,rule_element_visible_from: res1.rule_element_visible_from,rule_element_title: res1.rule_element_title, rule_element_article: res1. rule_element_article}, lang: {iso_639_1: reslang.iso_639_1 } }) as res, re
OPTIONAL MATCH path =(res1)-[:HAS_RULE_ELEMENT_SUCCESSOR*]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WITH Collect(path) as path_elements, res, re

CALL apoc.convert.toTree(path_elements, true, {
  nodes: {Rule_Element_State: ['rule_element_id', 'rule_elemnet_title', 'rule_element_show_anyway','rule_element_applies_from','rule_element_in_force_until','rule_element_applies_until','rule_element_in_force_from','rule_element_visible_until','rule_element_visible_from','rule_element_title', 'rule_element_article'], Language: ['iso_639_1']}
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
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]-(lang:Language)
OPTIONAL MATCH (res2:Rule_Element_State)-[r:HAS_RULE_ELEMENT_SUCCESSOR]->(res)
MATCH (lang)<-[:SOL_STATE_LANGUAGE_IS]-(sls:Sol_State)<-[:HAS_SOL_STATE]-(:Sol)<-[:RULE_ELEMENT_STATE_SOL_IS]-(res)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res3)
RETURN collect(
  {
  	identity: id(res),
    rule_elemnet_title: res.rule_elemnet_title,
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
    sol_name: sls.sol_name_01
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
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order = ruleElementDrop.rule_element_order )
      RETURN reDrop as re`;
    } else {
      query = `
      ${query}
      UNWIND $queryParams.drop_rule_element_order as ruleElementDrop
      OPTIONAL MATCH (repDrop:Rule_Element { rule_element_doc_id: ruleElementDrop.rule_element_parent_doc_id})-[r1:HAS_RULE_ELEMENT]->(reDrop:Rule_Element { rule_element_doc_id: ruleElementDrop.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order = ruleElementDrop.rule_element_order )
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
      FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | SET r2.order = ruleElementDrag.rule_element_order )
      WITH reDrag`;
    } else {
      query = `
      ${query}
      UNWIND $queryParams.drag_rule_element_order as ruleElementDrag
      OPTIONAL MATCH (repDrop:Rule_Element { rule_element_doc_id: ruleElementDrag.rule_element_parent_doc_id})-[r2:HAS_RULE_ELEMENT]->(reDrop:Rule_Element { rule_element_doc_id: ruleElementDrag.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | SET r2.order = ruleElementDrag.rule_element_order )
      WITH repDrop
      `;
    }
  }
  return query;
};

exports.changeRuleElementOrderQuery = (queryParams) => {
  let query = ``;
  if (queryParams.isInternalChangeOrder) {
    query = `${dropChangeOrderQuery(queryParams)}`;
  } else {
    // Remove relation between drag node and drag parent node
    if (
      queryParams.drag_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT
    ) {
      query = `
        ${query}
        OPTIONAL MATCH(rep_drag:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_parent_doc_id}" })-[r1_drag:HAS_RULE_ELEMENT]->(re_drag:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        WITH r1_drag`;
    } else if (
      queryParams.drag_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
        ${query}
        OPTIONAL MATCH(rb_drag:Rule_Book { rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi_drag:Rule_Book_Issue { rule_book_issue_no: ${queryParams.rule_book_issue_no} })-[r1_drag:HAS_RULE_ELEMENT]->(reDrop:Rule_Element {rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        WITH r1_drag`;
    }
    // Create relation between drag node and drop parent node
    if (
      queryParams.drop_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT
    ) {
      query = `
        ${query}
        MATCH(rep_drop:Rule_Element { rule_element_doc_id: "${queryParams.drop_rule_element_parent_doc_id}" })
        MATCH(re_drop:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        MERGE (rep_drop)-[:HAS_RULE_ELEMENT]->(re_drop)
        WITH re_drop`;
    } else if (
      queryParams.drop_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
        ${query}
        OPTIONAL MATCH (rb_drag:Rule_Book { rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi_drag:Rule_Book_Issue { rule_book_issue_no: ${queryParams.rule_book_issue_no} })
        OPTIONAL MATCH (re_drag_el:Rule_Element {rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        WITH rbi_drag, re_drag_el
        FOREACH (_ IN CASE WHEN rbi_drag IS NOT NULL THEN [1] END | MERGE (rbi_drag)-[:HAS_RULE_ELEMENT]->(re_drag_el))
        WITH re_drag_el`;
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
  MATCH (re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;

  if (queryParams.isValidDE) {
    query = `${query}
    CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
    FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
    WITH res_de, re, lang1, lang2`;
    if (queryParams.sol_de) {
      query = `${query}
      CALL {
        WITH res_de, re, lang1, lang2
        MATCH (sol_de:Sol {sol_id: ${queryParams.sol_de}})
        FOREACH (_ IN CASE WHEN sol_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_de) )
        RETURN sol_de
      }`;
    }
    if (queryParams.rule_element_successor_de) {
      query = `${query}
      CALL {
        WITH res_de, re, lang1, lang2
        MATCH (res_s_de2:Rule_Element_State) WHERE id(res_s_de2) = ${queryParams.rule_element_successor_de} AND NOT (res_s_de2)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
        FOREACH (_ IN CASE WHEN res_s_de2 IS NOT NULL THEN [1] END | MERGE (res_s_de2)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(res_de))
        RETURN res_s_de2
      }`;
    }
  }

  if (queryParams.isValidEN) {
    if (queryParams.isValidDE) {
      query = `${query}
      WITH res_de, re, lang1, lang2`;
    }
    query = `${query}
    CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
    FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )`;
    if (queryParams.isValidDE) {
      query = `${query}
      WITH res_en, re, res_de, lang1, lang2`;
    } else {
      query = `${query}
      WITH res_en, re, lang1, lang2`;
    }
    if (queryParams.sol_en) {
      query = `${query}
      CALL {
        WITH res_en, re
        MATCH (sol_en:Sol {sol_id: ${queryParams.sol_en}})
        FOREACH (_ IN CASE WHEN sol_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_en) )
        RETURN sol_en
      }`;
    }
    if (queryParams.rule_element_successor_en) {
      if (queryParams.isValidDE) {
        query = `${query}
        CALL {
          WITH res_en, re, res_de, lang1, lang2
          MATCH (res_s_en1:Rule_Element_State) WHERE id(res_s_en1) = ${queryParams.rule_element_successor_en}
          FOREACH (_ IN CASE WHEN res_s_en1 IS NOT NULL THEN [1] END | MERGE (res_s_en1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(res_en))
          RETURN res_s_en1
        }`;
      } else {
        query = `${query}
        CALL {
          WITH res_en, re, lang1, lang2
          MATCH (res_s_en1:Rule_Element_State) WHERE id(res_s_en1) = ${queryParams.rule_element_successor_en} AND NOT (res_s_en1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
          FOREACH (_ IN CASE WHEN res_s_en1 IS NOT NULL THEN [1] END | MERGE (res_s_en1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(res_en))
          RETURN res_s_en1
        }`;
      }
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
    FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_de))
    FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_en))
    WITH re`;
  }

  query = `${query}
  RETURN re`;
  return query;
};

exports.updateRuleElementStateQuery = (queryParams) => {
  let query = `
  MATCH (re:Rule_Element { rule_element_doc_id: "${queryParams.rule_element_doc_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;

  if (queryParams.isValidDE) {
    if (queryParams.res.de.identity) {
      query = `${query}
      MATCH (res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      WHERE id(res_de) = $queryParams.res.de.identity
      FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
      WITH res_de, lang1, lang2, re`;
    } else {
      query = `${query}
      OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(resDe:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      WHERE NOT (resDe)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
      WITH res_de, lang1, lang2, re, resDe
      CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_de:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang1)
      FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | SET res_de = $queryParams.res.de )
      WITH res_de, lang1, lang2, re, resDe
      CALL {
        WITH resDe, res_de, lang1, lang2, re
        FOREACH (_ IN CASE WHEN resDe IS NOT NULL THEN [1] END | MERGE (res_de)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(resDe) )
        RETURN resDe
      }
      WITH res_de, lang1, lang2, re, resDe`;
    }
    if (queryParams.sol_de) {
      query = `${query}
      OPTIONAL MATCH (res_de)-[r1:RULE_ELEMENT_STATE_SOL_IS]->()
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | DELETE r1)
      WITH res_de, lang1, lang2, re
      MATCH (sol_de:Sol {sol_id: ${queryParams.sol_de}})
      FOREACH (_ IN CASE WHEN sol_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_de))`;
    }
  }

  if (queryParams.isValidEN) {
    if (queryParams.isValidDE) {
      query = `${query}
      WITH res_de, lang1, lang2, re`;
    }
    if (queryParams.res.en.identity) {
      query = `${query}
      MATCH (res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      WHERE id(res_en) = $queryParams.res.en.identity
      FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )`;
    } else {
      if (queryParams.isValidDE) {
        query = `${query}
        WITH res_en, re, res_de, lang1, lang2`;
      } else {
        query = `${query}
        WITH res_en, re, lang1, lang2`;
      }

      query = `${query}
      OPTIONAL MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(resEn:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      WHERE NOT (resEn)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
      CREATE (re)-[:HAS_RULE_ELEMENT_STATE]->(res_en:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang2)
      FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | SET res_en = $queryParams.res.en )`;

      if (queryParams.isValidDE) {
        query = `${query}
        WITH res_en, re, res_de, lang1, lang2, resEn
        FOREACH (_ IN CASE WHEN resEn IS NOT NULL THEN [1] END | MERGE (res_en)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(resEn))
        WITH res_en, re, res_de, lang1, lang2`;
      } else {
        query = `${query}
        WITH res_en, re, lang1, lang2, resEn
        FOREACH (_ IN CASE WHEN resEn IS NOT NULL THEN [1] END | MERGE (res_en)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(resEn))
        WITH res_en, re, lang1, lang2`;
      }
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
      MATCH (sol_en:Sol {sol_id: ${queryParams.sol_en}})
      FOREACH (_ IN CASE WHEN sol_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_SOL_IS]->(sol_en))`;
    }
  }
  if (queryParams.isValidEN && queryParams.isValidDE) {
    query = `${query}
    WITH res_en, re, res_de, lang1, lang2
    OPTIONAL MATCH (res_en)-[en_v1:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->()
    OPTIONAL MATCH (res_de)-[de_v1:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->()
    DELETE en_v1, de_v1
    WITH res_en, re, res_de, lang1, lang2
    FOREACH (_ IN CASE WHEN res_en IS NOT NULL THEN [1] END | MERGE (res_en)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_de))
    FOREACH (_ IN CASE WHEN res_de IS NOT NULL THEN [1] END | MERGE (res_de)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res_en))`;
  }

  if (queryParams.isValidDE && queryParams.isValidEN) {
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

exports.getRuleElementStateDetails = `
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]-(res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WHERE id(res) IN $array_of_identity
OPTIONAL MATCH (res)-[:RULE_ELEMENT_STATE_SOL_IS]->(sl:Sol)
RETURN res, lang, sl
`;

exports.deleteRuleElementState = `
MATCH (re:Rule_Element)-[r1:HAS_RULE_ELEMENT_STATE]->(res1:Rule_Element_State)
WHERE re.rule_element_doc_id = $rule_element_doc_id AND id(res1) IN $identities AND NOT (res1)-[:HAS_RULE_ELEMENT_SUCCESSOR]->(:Rule_Element_State)
OPTIONAL MATCH(res1)<-[r2:HAS_RULE_ELEMENT_SUCCESSOR]-(res2:Rule_Element_State)
OPTIONAL MATCH(res1)-[r3:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(:Rule_Element_State)
OPTIONAL MATCH(res1)<-[r4:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]-(:Rule_Element_State)
WITH res1, r1, r2, res2, r3, r4
// FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | DELETE r2)
// FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | DELETE r3)
// FOREACH (_ IN CASE WHEN r4 IS NOT NULL THEN [1] END | DELETE r4)
RETURN DISTINCT res1,res2
RETURN DISTINCT res1,res2
`;
