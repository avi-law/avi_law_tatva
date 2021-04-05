exports.getRuleBookById = `MATCH (rb:Rule_Book {rule_book_id: $rule_book_id}) return rb`;

exports.getRuleBookStructById = `MATCH (rbs:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id}) return rbs`;

exports.addRuleBookStructQuery = (queryParams) => {
  let query = `
  MATCH (rbsp:Rule_Book_Struct {rule_book_struct_id: "${queryParams.rule_book_struct_parent_id}"})
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;
  if (queryParams.isExists) {
    query = `
    ${query}
    MATCH (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rbs.rule_book_struct_id}" })
    MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_CHILD {order_rule_book_in_struct: ${queryParams.rule_book_struct_order}}]->(rbsp)`;
  } else {
    query = `
    ${query}
    MERGE (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rbs.rule_book_struct_id}" })
    SET rbs.rule_book_struct_active = ${queryParams.rbs.rule_book_struct_active}`;

    if (queryParams.isValidDE) {
      query = `${query}
      MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_de:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang1)
      SET rbss_de = ${queryParams.rbss.de}`;
    }
    if (queryParams.isValidEN) {
      query = `${query}
      MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_en:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang2)
      SET rbss_en = ${queryParams.rbss.en}`;
    }
    query = `${query}
      MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_CHILD {order_rule_book_in_struct: ${queryParams.rule_book_struct_order}}]->(rbsp)
      RETURN rbs`;
  }
  return query;
};

exports.updateRuleBookStructQuery = (queryParams) => {
  let query = `
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  MERGE (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructId}" })
  SET rbs.rule_book_struct_id = ${queryParams.rbs.rule_book_struct_id}, rbs.rule_book_struct_active = ${queryParams.rbs.rule_book_struct_active}`;

  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_de:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang1)
    SET rbss_de = ${queryParams.rbss.de}`;
  } else {
    query = `${query}
    WITH rbs, lang1, lang2
    OPTIONAL MATCH (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_de:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang1)
    DETACH DELETE rbss_de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_en:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang2)
    SET rbss_en = ${queryParams.rbss.en}`;
  } else {
    query = `${query}
    WITH rbs, rbsp, lang1, lang2
    OPTIONAL MATCH (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_en:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang2)
    DETACH DELETE rbss_en`;
  }

  query = `${query}
  RETURN rbs`;
  return query;
};

exports.deleteRuleBookStructQuery = (queryParams) => {
  const query = `
  OPTIONAL MATCH (rbs:Rule_Book_Struct { rule_book_struct_id: ${queryParams.ruleBookStructId} })-[r1:HAS_RULE_BOOK_STRUCT_CHILD]->(rbsp:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructParentId}" })
  DETACH DELETE r1
  RETURN rbs
  `;
  return query;
};

exports.addRuleBookQuery = (queryParams) => {
  let query = ``;

  if (queryParams.rule_book_parent_struct_id) {
    query = `OPTIONAL MATCH (rbsp:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rule_book_struct_parent_id}" })`;
  } else if (queryParams.rule_book_parent_id) {
    query = `OPTIONAL MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })`;
  }
  query = `
  ${query}
  MERGE (rb:Rule_Book { rule_book_id: ${queryParams.rb.rule_book_id} })
  SET rb.rule_book_active = ${queryParams.rb.rule_book_active}`;

  if (queryParams.rule_book_parent_struct_id) {
    query = `${query}
    MERGE (rb)-[:RULE_BOOK_BELONGS_TO_STRUCT{order_rule_book_in_struct: ${queryParams.rule_book_struct_order}}]->(rbsp)
    RETURN rb`;
  } else if (queryParams.rule_book_parent_id) {
    query = `${query}
    MERGE (rb)-[:RULE_BOOK_CHILD {order_rule_book_child: ${queryParams.rule_book_child_order}}]->(rbp)
    RETURN rb`;
  }
  return query;
};

exports.updateRuleBookQuery = (queryParams) => {
  const query = `
    MERGE (rb:Rule_Book { rule_book_id: ${queryParams.ruleBookId} })
    SET rb.rule_book_id = ${queryParams.rb.rule_book_id}, rb.rule_book_active = ${queryParams.rb.rule_book_active}`;
  return query;
};

exports.deleteRuleBookQuery = (queryParams) => {
  let query = ``;

  if (queryParams.ruleBookStructParentId) {
    query = `OPTIONAL MATCH (rb:Rule_Book { rule_book_id: ${queryParams.ruleBookId} })-[r1:RULE_BOOK_BELONGS_TO_STRUCT]->(rbsp:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructParentId}" })`;
  } else if (queryParams.ruleBookParentId) {
    query = `OPTIONAL MATCH MATCH (rb:Rule_Book { rule_book_id: ${queryParams.ruleBookId} })-[r1:RULE_BOOK_CHILD]->(rbp:Rule_Book { rule_book_id: "${queryParams.ruleBookParentId}" })`;
  }

  query = `${query}
  DETACH DELETE r1
  RETURN rb`;
  return query;
};

exports.addruleBookIssueQuery = (queryParams) => {
  let query = `
  MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  MERGE (rbi:Rule_Book_Issue $queryParams.rbi)`;

  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    SET rbis_de = $queryParams.rbis.de`;
  } else if (!queryParams.isValidDE && queryParams.isUpdate) {
    query = `${query}
    WITH rbi, lang1, lang2, rbp
    OPTIONAL MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    DETACH DELETE rbis_de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_en:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang2)
    SET rbis_en = $queryParams.rbis.en`;
  } else if (!queryParams.isValidEN && queryParams.isUpdate) {
    query = `${query}
    WITH rbi, lang1, lang2, rbp
    OPTIONAL MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_en:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang2)
    DETACH DELETE rbis_en`;
  }

  query = `${query}
  MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE]->(rbp)
  RETURN rbi`;
  return query;
};

exports.updateRuleBookIssueQuery = (queryParams) => {
  let query = `
  OPTIONAL MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no : ${queryParams.ruleBookIssueNo}})
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  SET rbi = $queryParams.rbi`;

  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    SET rbis_de = $queryParams.rbis.de`;
  } else if (!queryParams.isValidDE && queryParams.isUpdate) {
    query = `${query}
    WITH rbi, lang1, lang2, rbp
    OPTIONAL MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    DETACH DELETE rbis_de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_en:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang2)
    SET rbis_en = $queryParams.rbis.en`;
  } else if (!queryParams.isValidEN && queryParams.isUpdate) {
    query = `${query}
    WITH rbi, lang1, lang2, rbp
    OPTIONAL MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_en:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang2)
    DETACH DELETE rbis_en`;
  }

  query = `${query}
    RETURN rbi`;
  return query;
};

exports.deleteRuleBookIssueQuery = (queryParams) => {
  const query = `
  OPTIONAL MATCH (rb:Rule_Book { rule_book_id: ${queryParams.ruleBookParentId} })-[r1:HAS_RULE_BOOK_STRUCT_CHILD]->(rbi:Rule_Book_Issue { rule_book_issue_no: "${queryParams.ruleBookIssueNo}" })-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)
  DETACH DELETE r1, rbi, rbis
  RETURN rbi
  `;
  return query;
};

exports.logRulebook = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]-(rb)
`;

exports.logRulebookStruct = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (rbs:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]-(rbs)
`;

exports.getRuleBookIssue = `
MATCH (rb:Rule_Book {rule_book_id: $rule_book_parent_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no: $rule_book_issue_no})
CALL {
  WITH rbi
  MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
  RETURN collect({ rbis: rbis, lang: lang }) AS rbis
}
CALL {
  WITH rbi
  MATCH (rbi)-[:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->(sl:Sol)
  RETURN collect(sl) AS sl
}
RETURN rbi, rbis, sl
`;
