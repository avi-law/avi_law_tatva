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

exports.ruleElementStateList = `
MATCH (re:Rule_Element {rule_element_doc_id: $rule_element_doc_id})
CALL {
WITH re
  MATCH (re)-[:HAS_RULE_ELEMENT_STATE]->(res:Rule_Element_State)-	[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
  WITH res, lang order by res.rule_element_id
  RETURN collect({ res: res, lang: lang }) as res
}
RETURN re, res;
`;

exports.deleteRuleElement = (queryParams) => {
  let query = "";
  if (queryParams.ruleElementDocParentId) {
    query = `MATCH (rep:Rule_Element { rule_element_doc_id: "${queryParams.ruleElementDocParentId}" })-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element {rule_element_doc_id: ${queryParams.rule_element_doc_id})
    DELETE r1
    RETURN re;
    `;
  } else if (queryParams.ruleBookIssueNo && queryParams.ruleBookId) {
    query = `MATCH (rb:Rule_Book {rule_book_id: "${queryParams.ruleBookId}"})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: ${queryParams.ruleBookIssueNo} })-[r1:HAS_RULE_ELEMENT]->(re:Rule_Element {rule_element_doc_id: ${queryParams.rule_element_doc_id} })
    DELETE r1
    RETURN re;
    `;
  }
  return query;
};
