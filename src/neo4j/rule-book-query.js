exports.getRuleBookById = `MATCH (rb:Rule_Book {rule_book_id: $rule_book_id}) return rb`;

exports.getRuleBookStructById = `MATCH (rbs:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id}) return rbs`;

exports.addRuleBookStructQuery = (queryParams) => {
  let query = `
  MATCH (rbsp:Rule_Book_Struct {rule_book_struct_id: "${queryParams.rule_book_struct_parent_id}"})`;
  if (queryParams.isExists) {
    query = `
    ${query}
    MATCH (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rbs.rule_book_struct_id}" })`;
  } else {
    query = `
    ${query}
    MATCH (lang1:Language {iso_639_1: "de"})
    MATCH (lang2:Language {iso_639_1: "en"})
    MERGE (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rbs.rule_book_struct_id}" })
    SET rbs.rule_book_struct_active = ${queryParams.rbs.rule_book_struct_active}`;

    if (queryParams.isValidDE) {
      query = `${query}
      MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_de:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang1)
      SET rbss_de = $queryParams.rbss.de`;
    }
    if (queryParams.isValidEN) {
      query = `${query}
      MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_en:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang2)
      SET rbss_en = $queryParams.rbss.en`;
    }
    query = `${query}
      MERGE (rbs)<-[:HAS_RULE_BOOK_STRUCT_CHILD {order_rule_book_struct: ${queryParams.rule_book_struct_order}}]-(rbsp)
      RETURN rbs`;
  }
  return query;
};

exports.updateRuleBookStructQuery = (queryParams) => {
  let query = `
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  MERGE (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructId}" })
  SET rbs.rule_book_struct_id = $queryParams.rbs.rule_book_struct_id, rbs.rule_book_struct_active = $queryParams.rbs.rule_book_struct_active`;

  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_de:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang1)
    SET rbss_de = $queryParams.rbss.de`;
  } else {
    query = `${query}
    WITH rbs, lang1, lang2
    OPTIONAL MATCH (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_de:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang1)
    DETACH DELETE rbss_de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_en:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang2)
    SET rbss_en = $queryParams.rbss.en`;
  } else {
    query = `${query}
    WITH rbs, lang1, lang2
    OPTIONAL MATCH (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss_en:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang2)
    DETACH DELETE rbss_en`;
  }

  query = `${query}
  RETURN rbs`;
  return query;
};

exports.deleteRuleBookStructQuery = () => {
  const query = `
  OPTIONAL MATCH (rbs1:Rule_Book_Struct { rule_book_struct_id: $queryParams.ruleBookStructId })-[:HAS_RULE_BOOK_STRUCT_CHILD*0..]->(rbs2:Rule_Book_Struct)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss:Rule_Book_Struct_State)
  DETACH DELETE rbs2,rbss
  RETURN rbs1,rbs2,rbss
  `;
  return query;
};

exports.addRuleBookQuery = (queryParams) => {
  let query = ``;

  if (queryParams.rule_book_struct_parent_id) {
    query = `MATCH (rbsp:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rule_book_struct_parent_id}" })`;
  } else if (queryParams.rule_book_parent_id) {
    query = `MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })`;
  }
  query = `
  ${query}
  MERGE (rb:Rule_Book { rule_book_id: "${queryParams.rb.rule_book_id}" })
  SET rb.rule_book_active = ${queryParams.rb.rule_book_active}`;

  if (queryParams.rule_book_struct_parent_id) {
    query = `${query}
    MERGE (rb)-[:RULE_BOOK_BELONGS_TO_STRUCT{order_rule_book_in_struct: ${queryParams.rule_book_struct_order}}]->(rbsp)
    RETURN rb`;
  } else if (queryParams.rule_book_parent_id) {
    query = `${query}
    MERGE (rb)<-[:HAS_RULE_BOOK_CHILD {order_rule_book_child: ${queryParams.rule_book_child_order}}]-(rbp)
    RETURN rb`;
  }
  return query;
};

exports.updateRuleBookQuery = () => {
  const query = `
    MATCH (rb:Rule_Book { rule_book_id: $queryParams.ruleBookId })
    SET rb.rule_book_id = $queryParams.rb.rule_book_id, rb.rule_book_active = $queryParams.rb.rule_book_active
    RETURN rb`;
  return query;
};

exports.deleteRuleBookQuery = (queryParams) => {
  let query = ``;
  if (queryParams.ruleBookStructParentId) {
    query = `OPTIONAL MATCH (rb:Rule_Book { rule_book_id: "${queryParams.ruleBookId}" })-[r1:RULE_BOOK_BELONGS_TO_STRUCT]->(rbsp:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructParentId}" })`;
  } else if (queryParams.ruleBookParentId) {
    query = `OPTIONAL MATCH (rb:Rule_Book { rule_book_id: "${queryParams.ruleBookId}" })<-[r1:HAS_RULE_BOOK_CHILD]-(rbp:Rule_Book { rule_book_id: "${queryParams.ruleBookParentId}" })`;
  }
  query = `${query}
  DETACH DELETE r1
  RETURN rb`;
  return query;
};

exports.addruleBookIssueQuery = (queryParams) => {
  let slTags = [];
  let i = 0;
  if (queryParams.sl_tags.length > 0) {
    queryParams.sl_tags.forEach((slId) => {
      slTags = `${slTags}, { order: ${(i += 1)}, sol_id: ${slId} }`;
    });
  }
  slTags = slTags.replace(/^,|,$/g, "");

  let query = `
  MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  MERGE (rbp)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: $queryParams.rbi.rule_book_issue_no })
  ON CREATE
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
  if (slTags.length > 0) {
    query = `${query}
    MERGE (rbp)-[:HAS_RULE_BOOK_ISSUE]->(rbi)
    WITH rbi
    UNWIND [${slTags}] as slTags
    OPTIONAL MATCH (sl:Sol {sol_id: slTags.sol_id})
    FOREACH (_ IN CASE WHEN sl IS NOT NULL THEN [1] END | MERGE (rbi)-[:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS {sol_ord: slTags.order}]->(sl) )
    RETURN rbi`;
  } else {
    query = `${query}
    MERGE (rbp)-[:HAS_RULE_BOOK_ISSUE]->(rbi)
    RETURN rbi`;
  }
  return query;
};

exports.updateRuleBookIssueQuery = (queryParams) => {
  let slTags = "";
  let i = 0;
  if (queryParams.sl_tags && queryParams.sl_tags.length > 0) {
    queryParams.sl_tags.forEach((slId) => {
      slTags = `${slTags}, { order: ${(i += 1)}, sol_id: ${slId} }`;
    });
  }
  slTags = slTags.replace(/^,|,$/g, "");

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

  if (slTags.length > 0) {
    query = `${query}
    WITH rbi
    OPTIONAL MATCH (rbi)-[r2:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->()
    DETACH DELETE r2
    WITH rbi
    UNWIND [${slTags}] as slTags
    MATCH (sl:Sol {sol_id: slTags.sol_id})
    FOREACH (_ IN CASE WHEN sl IS NOT NULL THEN [1] END | MERGE (rbi)-[:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS {sol_ord: slTags.order}]->(sl) )
    RETURN rbi`;
  } else {
    query = `${query}
    WITH rbi
    OPTIONAL MATCH (rbi)-[r2:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->()
    DETACH DELETE r2
    RETURN rbi`;
  }
  return query;
};

exports.deleteRuleBookIssueQuery = (queryParams) => {
  const query = `
  OPTIONAL MATCH (rb:Rule_Book { rule_book_id: "${queryParams.ruleBookParentId}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no: ${queryParams.ruleBookIssueNo} })-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)
  OPTIONAL MATCH (rbi)-[r1:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->()
  DETACH DELETE r1, rbi, rbis
  RETURN rbi`;
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
  MATCH (rbi)-[r1:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->(sl:Sol)
  RETURN collect({sol_id:sl.sol_id, order: r1.sol_ord}) AS sl
}
RETURN rbi, rbis, sl
`;

exports.getSolTagForRuleBookIssue = `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)
CALL {
  WITH sl
  MATCH (sl)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
  RETURN collect({ sls: sls, lang: lang }) AS slState
}
RETURN distinct sl, cou, slState as sls
ORDER BY sl.sol_date DESC
`;

const dropQuery = (queryParams) => {
  let query = ``;
  if (
    queryParams.drop_rule_book_order &&
    queryParams.drop_rule_book_order.length > 0
  ) {
    if (queryParams.drop_rule_book_struct_parent_id) {
      query = `
        ${query}
        UNWIND $queryParams.drop_rule_book_order as ruleBook
        OPTIONAL MATCH (rbDrop:Rule_Book { rule_book_id: ruleBook.rule_book_id})-[r1:RULE_BOOK_BELONGS_TO_STRUCT]->(rbsDrop:Rule_Book_Struct { rule_book_struct_id: ruleBook.rule_book_struct_parent_id })
        // FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order_rule_book_in_struct = ruleBook.rule_book_order )
        RETURN rbDrop as rb
        `;
    } else if (queryParams.drop_rule_book_parent_id) {
      query = `
        ${query}
        UNWIND $queryParams.drop_rule_book_order as ruleBook
        OPTIONAL MATCH (rbpDrop:Rule_Book { rule_book_id: ruleBook.rule_book_parent_id})-[r1:HAS_RULE_BOOK_CHILD]->(rbDrop:Rule_Book { rule_book_id: ruleBook.rule_book_id })
        // FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order_rule_book_child = ruleBook.rule_book_order )
        RETURN rbpDrop as rb
        `;
    }
  } else if (
    queryParams.drop_rule_book_struct_order &&
    queryParams.drop_rule_book_struct_order.length > 0
  ) {
    query = `
        ${query}
        UNWIND $queryParams.drop_rule_book_struct_order as ruleBookStruct
        OPTIONAL MATCH (rbspDrop:Rule_Book_Struct { rule_book_struct_id: ruleBookStruct.rule_book_struct_parent_id})-[r2:HAS_RULE_BOOK_STRUCT_CHILD]->(rbsDrop:Rule_Book_Struct { rule_book_struct_id: ruleBookStruct.rule_book_struct_id})
        // FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | SET r2.order_rule_book_struct = ruleBookStruct.rule_book_struct_order )
        RETURN rbspDrop as rb
      `;
  }
  return query;
};
const dragQuery = (queryParams) => {
  let query = ``;
  if (
    queryParams.drag_rule_book_order &&
    queryParams.drag_rule_book_order.length > 0
  ) {
    if (queryParams.drag_rule_book_struct_id) {
      query = `
        ${query}
        UNWIND $queryParams.drag_rule_book_order as ruleBook
        OPTIONAL MATCH (rbDrag:Rule_Book { rule_book_id: ruleBook.rule_book_id})-[r3:RULE_BOOK_BELONGS_TO_STRUCT]->(rbsDrag:Rule_Book_Struct { rule_book_struct_id: ruleBook.rule_book_struct_parent_id })
        // FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | SET r3.order_rule_book_in_struct = ruleBook.rule_book_order )
        WITH rbDrag
      `;
    } else if (queryParams.drag_rule_book_id) {
      query = `
        ${query}
        UNWIND $queryParams.drag_rule_book_order as ruleBook
        OPTIONAL MATCH (rbpDrag:Rule_Book { rule_book_id: ruleBook.rule_book_parent_id})-[r3:HAS_RULE_BOOK_CHILD]->(rbDrag:Rule_Book { rule_book_id: ruleBook.rule_book_id })
        // FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | SET r3.order_rule_book_child = ruleBook.rule_book_order )
        WITH rbpDrag
        `;
    }
  } else if (
    queryParams.drag_rule_book_struct_order &&
    queryParams.drag_rule_book_struct_order.length > 0
  ) {
    query = `
        ${query}
        UNWIND $queryParams.drag_rule_book_struct_order as ruleBookStruct
        OPTIONAL MATCH (rbspDrag:Rule_Book_Struct { rule_book_struct_id: ruleBookStruct.rule_book_struct_parent_id})-[r4:HAS_RULE_BOOK_STRUCT_CHILD]->(rbsDrag:Rule_Book_Struct { rule_book_struct_id: ruleBookStruct.rule_book_struct_id})
        // FOREACH (_ IN CASE WHEN r4 IS NOT NULL THEN [1] END | SET r4.order_rule_book_struct = ruleBookStruct.rule_book_struct_order )
        WITH rbspDrag
      `;
  }
  return query;
};

exports.changeOrderQuery = (queryParams) => {
  let query = ``;
  if (queryParams.isInternalDrop) {
    query = `
    ${query}
    ${dropQuery(queryParams)}
    `;
  } else {
    query = `
    ${query}
    ${dragQuery(queryParams)}
    ${dropQuery(queryParams)}
    `;
  }
  return query;
};
