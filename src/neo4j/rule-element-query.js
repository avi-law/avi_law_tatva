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
    MERGE (re)<-[:HAS_RULE_ELEMENT {order: ${queryParams.rule_element_order}}]-(rep)
    RETURN re`;
  } else if (queryParams.rule_book_issue_no && queryParams.rule_book_id) {
    query = `${query}
    MERGE (re)<-[:HAS_RULE_ELEMENT {order: ${queryParams.rule_element_order}}]-(rbi)
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
  WITH res, lang order by res.rule_element_id
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

MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})-[:HAS_RULE_ELEMENT_STATE]->(res1:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(reslang:Language)
WHERE NOT (res1)<-[:HAS_RULE_ELEMENT_SUCCESSOR]-(:Rule_Element_State)
OPTIONAL MATCH path = (res1)-[:HAS_RULE_ELEMENT_SUCCESSOR*]->(res2:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WITH Collect(path)as path_elements, reslang, re, collect({res1: res1, lang: reslang}) as res
CALL apoc.convert.toTree(path_elements) yield value
RETURN re, res, value
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
      OPTIONAL MATCH (repDrop:Rule_Element { element_doc_id: ruleElementDrop.rule_element_parent_doc_id})-[r1:HAS_RULE_ELEMENT]->(reDrop:Rule_Element { rule_element_doc_id: ruleElementDrop.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order = ruleElementDrop.rule_element_order )
      RETURN reDrop as re
      `;
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
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r2.order = ruleElementDrag.rule_element_order )
      RETURN reDrag as re`;
    } else {
      query = `
      ${query}
      UNWIND $queryParams.drag_rule_element_order as ruleElementDrag
      OPTIONAL MATCH (repDrop:Rule_Element { element_doc_id: ruleElementDrag.rule_element_parent_doc_id})-[r2:HAS_RULE_ELEMENT]->(reDrop:Rule_Element { rule_element_doc_id: ruleElementDrag.rule_element_doc_id })
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r2.order = ruleElementDrag.rule_element_order )
      RETURN repDrop as re
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
        `;
    } else if (
      queryParams.drag_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
        ${query}
        OPTIONAL MATCH(rb_drag:Rule_Book { rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi_drag:Rule_Book_Issue { rule_book_issue_no: ${queryParams.rule_book_issue_no} })-[r1_drag:HAS_RULE_ELEMENT]->(reDrop:Rule_Element {rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        `;
    }
    // Create relation between drag node and drop parent node
    if (
      queryParams.drop_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_ELEMENT
    ) {
      query = `
        ${query}
        MERGE(rep_drop:Rule_Element { rule_element_doc_id: "${queryParams.drop_rule_element_parent_doc_id}" })-[:HAS_RULE_ELEMENT]->(re_drop:Rule_Element { rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        `;
    } else if (
      queryParams.drop_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
    ) {
      query = `
        ${query}
        MERGE(rb_drag:Rule_Book { rule_book_id: "${queryParams.rule_book_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi_drag:Rule_Book_Issue { rule_book_issue_no: ${queryParams.rule_book_issue_no} })-[:HAS_RULE_ELEMENT]->(re_drop:Rule_Element {rule_element_doc_id: "${queryParams.drag_rule_element_doc_id}" })
        `;
    }
    query = `
      ${query}
      ${dragChangeOrderQuery(queryParams)}
      ${dropChangeOrderQuery(queryParams)}
      `;
  }
  return query;
};
