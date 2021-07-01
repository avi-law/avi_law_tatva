const { constants } = require("../utils");

exports.getRuleBookById = `MATCH (rb:Rule_Book {rule_book_id: $rule_book_id}) return rb`;

exports.getRuleBookStructById = `MATCH (rbs:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id}) return rbs`;

exports.getRuleBookStructParentById = `
MATCH (rbs:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id})<-[:HAS_RULE_BOOK_STRUCT_CHILD]-(rbsp:Rule_Book_Struct)
RETURN rbsp`;

exports.getRuleBookStructParentByCondition = (queryParams) => {
  let query = `
  OPTIONAL MATCH (rbs1:Rule_Book_Struct)-[:HAS_RULE_BOOK_STRUCT_CHILD*1..]->(rbs2:Rule_Book_Struct { rule_book_struct_id: "${queryParams.rule_book_struct_id}" })`;
  query = `
    ${query}
    RETURN rbs1`;
  return query;
};

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
      MERGE (rbs)<-[:HAS_RULE_BOOK_STRUCT_CHILD {order_rule_book_struct: toInteger(${queryParams.rule_book_struct_order})}]-(rbsp)
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

exports.deleteRuleBookStructQuery = (queryParams) => {
  const query = `
  OPTIONAL MATCH (rbs:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructId}" })<-[r1:HAS_RULE_BOOK_STRUCT_CHILD]-(rbsp:Rule_Book_Struct { rule_book_struct_id: "${queryParams.ruleBookStructParentId}" })
  DELETE r1
  RETURN rbs, rbsp`;
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
    MERGE (rb)-[:RULE_BOOK_BELONGS_TO_STRUCT{order_rule_book_in_struct: toInteger(${queryParams.rule_book_child_order})}]->(rbsp)
    RETURN rb`;
  } else if (queryParams.rule_book_parent_id) {
    query = `${query}
    MERGE (rb)<-[:HAS_RULE_BOOK_CHILD {order_rule_book_child: toInteger(${queryParams.rule_book_child_order})}]-(rbp)
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
  DELETE r1
  RETURN rb`;
  return query;
};

exports.addruleBookIssueQuery = (queryParams) => {
  let slTags = [];
  let i = 0;
  if (queryParams.sl_tags && queryParams.sl_tags.length > 0) {
    queryParams.sl_tags.forEach((slId) => {
      slTags = `${slTags}, { order: ${(i += 1)}, sol_id: ${slId} }`;
    });
    slTags = slTags.replace(/^,|,$/g, "");
  }

  let query = `
  MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  MERGE (rbp)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger($queryParams.rbi.rule_book_issue_no) })
  ON CREATE
    SET rbi = $queryParams.rbi`;
  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    SET rbis_de = $queryParams.rbis.de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_en:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang2)
    SET rbis_en = $queryParams.rbis.en`;
  }
  if (slTags.length > 0) {
    query = `${query}
    MERGE (rbp)-[:HAS_RULE_BOOK_ISSUE]->(rbi)
    WITH rbi
    UNWIND [${slTags}] as slTags
    OPTIONAL MATCH (sl:Sol {sol_id: slTags.sol_id})
    FOREACH (_ IN CASE WHEN sl IS NOT NULL THEN [1] END | MERGE (rbi)-[:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS {sol_ord: toInteger(slTags.order)}]->(sl) )
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
    slTags = slTags.replace(/^,|,$/g, "");
  }

  let query = `
  OPTIONAL MATCH (rbp:Rule_Book { rule_book_id: "${queryParams.rule_book_parent_id}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no : toInteger(${queryParams.ruleBookIssueNo})})
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})
  SET rbi = $queryParams.rbi`;
  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    SET rbis_de = $queryParams.rbis.de`;
  } else if (!queryParams.isValidDE) {
    query = `${query}
    WITH rbi, lang1, lang2, rbp
    OPTIONAL MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_de:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang1)
    DETACH DELETE rbis_de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis_en:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang2)
    SET rbis_en = $queryParams.rbis.en`;
  } else if (!queryParams.isValidEN) {
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
    OPTIONAL MATCH (sl:Sol {sol_id: slTags.sol_id})
    FOREACH (_ IN CASE WHEN sl IS NOT NULL THEN [1] END | MERGE (rbi)-[:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS {sol_ord: toInteger(slTags.order)}]->(sl) )
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
  OPTIONAL MATCH (rb:Rule_Book { rule_book_id: "${queryParams.ruleBookParentId}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no: toInteger(${queryParams.ruleBookIssueNo}) })-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)
  OPTIONAL MATCH (rbi)-[r1:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->()
  DETACH DELETE r1, rbi, rbis
  RETURN rbi`;
  return query;
};

exports.logRulebook = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id})
CALL {
  WITH b
  OPTIONAL MATCH(b)<-[:LOG_FOR_USER]-(plog:Log)
  WHERE NOT (plog)<-[:USER_LOG_PREDECESSOR]-()
  WITH plog ORDER BY plog.log_timestamp DESC
  RETURN plog
  LIMIT 1
}
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(rb)
FOREACH (_ IN CASE WHEN plog IS NOT NULL AND l1 IS NOT NULL THEN [1] END | MERGE (plog)<-[:USER_LOG_PREDECESSOR]-(l1))
`;

exports.logRulebookStruct = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (rbs:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id})
CALL {
  WITH b
  OPTIONAL MATCH(b)<-[:LOG_FOR_USER]-(plog:Log)
  WHERE NOT (plog)<-[:USER_LOG_PREDECESSOR]-()
  WITH plog ORDER BY plog.log_timestamp DESC
  RETURN plog
  LIMIT 1
}
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(rbs)
FOREACH (_ IN CASE WHEN plog IS NOT NULL AND l1 IS NOT NULL THEN [1] END | MERGE (plog)<-[:USER_LOG_PREDECESSOR]-(l1))
`;

exports.getRuleBookIssue = `
MATCH (rb:Rule_Book {rule_book_id: $rule_book_parent_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no: toInteger($rule_book_issue_no)})
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

exports.getSolTagForRuleBookIssue = (isSort) => {
  let query = `
  MATCH (sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)
  CALL {
    WITH sl
    MATCH (sl)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
    RETURN collect({ sls: {sol_name_01: sls.sol_name_01}, lang: { iso_639_1: lang.iso_639_1}}) AS slState
  }
  WITH sl, slState order by sls.sol_date DESC
  RETURN distinct sl.sol_id as sol_id,  sl.sol_date as sol_date, slState as sls
  `;
  if (isSort) {
    query = `MATCH (sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
    WITH sl, lang, sls order by toLower(sls.sol_name_01) ASC
    RETURN distinct sl.sol_id as sol_id, sl.sol_date as sol_date, collect({ sls: {sol_name_01: sls.sol_name_01}, lang: { iso_639_1: lang.iso_639_1}}) as sls`;
  }
  return query;
};

const dropChangeOrderQuery = (queryParams) => {
  let query = ``;
  if (
    queryParams.drop_rule_book_order &&
    queryParams.drop_rule_book_order.length > 0
  ) {
    // Tested
    if (queryParams.drop_rule_book_struct_parent_id) {
      query = `
        ${query}
        UNWIND $queryParams.drop_rule_book_order as ruleBookDrop
        OPTIONAL MATCH (rbDrop:Rule_Book { rule_book_id: ruleBookDrop.rule_book_id})-[r1:RULE_BOOK_BELONGS_TO_STRUCT]->(rbsDrop:Rule_Book_Struct { rule_book_struct_id: ruleBookDrop.rule_book_struct_parent_id })
        FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order_rule_book_in_struct = toInteger(ruleBookDrop.rule_book_order) )
        RETURN rbDrop as rb
        `;
    } else if (queryParams.drop_rule_book_parent_id) {
      // Tested
      query = `
        ${query}
        UNWIND $queryParams.drop_rule_book_order as ruleBookDrop
        OPTIONAL MATCH (rbpDrop:Rule_Book { rule_book_id: ruleBookDrop.rule_book_parent_id})-[r1:HAS_RULE_BOOK_CHILD]->(rbDrop:Rule_Book { rule_book_id: ruleBookDrop.rule_book_id })
        FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | SET r1.order_rule_book_child = toInteger(ruleBookDrop.rule_book_order) )
        RETURN rbpDrop as rb
        `;
    }
  } else if (
    queryParams.drop_rule_book_struct_order &&
    queryParams.drop_rule_book_struct_order.length > 0
  ) {
    // Tested
    query = `
        ${query}
        UNWIND $queryParams.drop_rule_book_struct_order as ruleBookStructDrop
        OPTIONAL MATCH (rbspDrop:Rule_Book_Struct { rule_book_struct_id: ruleBookStructDrop.rule_book_struct_parent_id})-[r2:HAS_RULE_BOOK_STRUCT_CHILD]->(rbsDrop:Rule_Book_Struct { rule_book_struct_id: ruleBookStructDrop.rule_book_struct_id})
        FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] END | SET r2.order_rule_book_struct = toInteger(ruleBookStructDrop.rule_book_struct_order) )
        RETURN rbspDrop as rb
      `;
  }
  return query;
};

const dragChangeOrderQuery = (queryParams) => {
  let query = ``;
  if (
    queryParams.drag_rule_book_order &&
    queryParams.drag_rule_book_order.length > 0
  ) {
    if (
      queryParams.drag_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT
    ) {
      query = `
        ${query}
        UNWIND $queryParams.drag_rule_book_order as ruleBookDrag
        OPTIONAL MATCH (rbDrag:Rule_Book { rule_book_id: ruleBookDrag.rule_book_id})-[r3:RULE_BOOK_BELONGS_TO_STRUCT]->(rbsDrag:Rule_Book_Struct { rule_book_struct_id: ruleBookDrag.rule_book_struct_parent_id })
        FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | SET r3.order_rule_book_in_struct = toInteger(ruleBookDrag.rule_book_order) )
        WITH rbDrag
      `;
    } else if (
      queryParams.drag_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_BOOK
    ) {
      query = `
        ${query}
        UNWIND $queryParams.drag_rule_book_order as ruleBookDrag
        OPTIONAL MATCH (rbpDrag:Rule_Book { rule_book_id: ruleBookDrag.rule_book_parent_id})-[r3:HAS_RULE_BOOK_CHILD]->(rbDrag:Rule_Book { rule_book_id: ruleBookDrag.rule_book_id })
        FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | SET r3.order_rule_book_child = toInteger(ruleBookDrag.rule_book_order) )
        WITH rbpDrag
        `;
    }
  } else if (
    queryParams.drag_rule_book_struct_order &&
    queryParams.drag_rule_book_struct_order.length > 0
  ) {
    query = `
        ${query}
        UNWIND $queryParams.drag_rule_book_struct_order as ruleBookStructDrag
        OPTIONAL MATCH (rbspDrag:Rule_Book_Struct { rule_book_struct_id: ruleBookStructDrag.rule_book_struct_parent_id})-[r4:HAS_RULE_BOOK_STRUCT_CHILD]->(rbsDrag:Rule_Book_Struct { rule_book_struct_id: ruleBookStructDrag.rule_book_struct_id})
        FOREACH (_ IN CASE WHEN r4 IS NOT NULL THEN [1] END | SET r4.order_rule_book_struct = toInteger(ruleBookStructDrag.rule_book_struct_order) )
        WITH rbspDrag
      `;
  }
  return query;
};

exports.changeOrderQuery = (queryParams) => {
  let query = ``;
  if (queryParams.isInternalChangeOrder) {
    query = `${dropChangeOrderQuery(queryParams)}`;
  } else if (
    queryParams.drag_type === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_ISSUE
  ) {
    // Create relation between drag rule book issue node and drop rule book node
    console.log(
      "Create relation between drag rule book issue node and drop rule book node"
    );
    query = `
        OPTIONAL MATCH(rbp_drag:Rule_Book { rule_book_id: "${queryParams.drag_rule_book_parent_id}" })-[r1_drag:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: toInteger(${queryParams.drag_rule_book_issue_no}) })
        FOREACH (_ IN CASE WHEN rbi IS NOT NULL THEN [1] END | MERGE(rbp_drop:Rule_Book { rule_book_id: "${queryParams.drop_rule_book_parent_id}" })-[r1_drop:HAS_RULE_BOOK_ISSUE]->(rbi))
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        RETURN rbp_drag as rb
      `;
  } else if (
    queryParams.drag_type === constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT
  ) {
    query = `
    ${query}
    OPTIONAL MATCH(rbsp_drag:Rule_Book_Struct { rule_book_struct_id: "${
      queryParams.drag_rule_book_struct_parent_id
    }" })-[r1_drag:HAS_RULE_BOOK_STRUCT_CHILD]->(rbs_drag:Rule_Book_Struct { rule_book_struct_id: "${
      queryParams.drag_rule_book_struct_id
    }" })
    FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
    MERGE(rbsp_drop:Rule_Book_Struct { rule_book_struct_id: "${
      queryParams.drop_rule_book_struct_parent_id
    }" })-[:HAS_RULE_BOOK_STRUCT_CHILD]->(rbs_drop:Rule_Book_Struct { rule_book_struct_id: "${
      queryParams.drag_rule_book_struct_id
    }" })
    WITH *
    ${dragChangeOrderQuery(queryParams)}
    ${dropChangeOrderQuery(queryParams)}
    `;
  } else {
    // Remove relation between drag node and drag parent node
    if (
      queryParams.drag_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_BOOK
    ) {
      query = `
        ${query}
        OPTIONAL MATCH(rbp_drag:Rule_Book { rule_book_id: "${queryParams.drag_rule_book_parent_id}" })-[r1_drag:HAS_RULE_BOOK_CHILD]->(rb_drag:Rule_Book { rule_book_id: "${queryParams.drag_rule_book_id}" })
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        `;
    } else if (
      queryParams.drag_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT
    ) {
      query = `
        ${query}
        MATCH(rb_drag:Rule_Book { rule_book_id: "${queryParams.drag_rule_book_id}" })-[r1_drag:RULE_BOOK_BELONGS_TO_STRUCT]->(rbs_drag:Rule_Book_Struct { rule_book_struct_id: "${queryParams.drag_rule_book_struct_parent_id}" })
        FOREACH (_ IN CASE WHEN r1_drag IS NOT NULL THEN [1] END | DELETE r1_drag )
        `;
    }
    // Create relation between drag node and drop parent node
    if (
      queryParams.drop_parent_type === constants.DRAG_AND_DROP_TYPE.RULE_BOOK
    ) {
      query = `
        ${query}
        WITH *
        MATCH(rbp_drop:Rule_Book { rule_book_id: "${queryParams.drop_rule_book_parent_id}" })
        MATCH(rb_drop:Rule_Book { rule_book_id: "${queryParams.drag_rule_book_id}" })
        FOREACH (_ IN CASE WHEN rbp_drop IS NOT NULL AND rb_drop IS NOT NULL THEN [1] END | MERGE(rbp_drop)-[:HAS_RULE_BOOK_CHILD]->(rb_drop) )
        `;
    } else if (
      queryParams.drop_parent_type ===
      constants.DRAG_AND_DROP_TYPE.RULE_BOOK_STRUCT
    ) {
      query = `
        ${query}
        WITH *
        MATCH(rb_drop:Rule_Book { rule_book_id: "${queryParams.drag_rule_book_id}" })
        MATCH(rbs_drop:Rule_Book_Struct { rule_book_struct_id: "${queryParams.drop_rule_book_struct_parent_id}" })
        FOREACH (_ IN CASE WHEN rb_drop IS NOT NULL AND rbs_drop IS NOT NULL THEN [1] END | MERGE(rb_drop)-[:RULE_BOOK_BELONGS_TO_STRUCT]->(rbs_drop) )
        `;
    }
    query = `
      ${query}
      WITH *
      ${dragChangeOrderQuery(queryParams)}
      ${dropChangeOrderQuery(queryParams)}
      `;
  }
  return query;
};

exports.getRuleBookBreadcrumbs = `
MATCH (rbs:Rule_Book_Struct),(rb:Rule_Book),
p = shortestPath((rbs)-[:HAS_RULE_BOOK_STRUCT_CHILD|RULE_BOOK_BELONGS_TO_STRUCT|HAS_RULE_BOOK_CHILD*..15]-(rb))
WHERE rbs.rule_book_struct_id = $rule_book_struct_id AND rb.rule_book_id = $rule_book_id
RETURN p
`;

exports.getRuleBookStructChildNode = `
MATCH(rbs1:Rule_Book_Struct)-[r1:HAS_RULE_BOOK_STRUCT_CHILD]->(rbs2:Rule_Book_Struct)
WHERE rbs1.rule_book_struct_id = $rule_book_struct_id
WITH rbs2, r1
CALL {
with rbs2
	MATCH (rbs2)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang:Language)
    RETURN collect({ rbss: rbss, lang: lang }) AS rbsState
}
WITH rbs2, rbsState order by r1.order
RETURN rbs2, rbsState`;

exports.getRuleBook = `
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)
CALL {
  WITH rbi
  MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
  RETURN collect({ rbis: rbis, lang: lang }) AS rbis
}
CALL {
  WITH rbi
  MATCH (rbi)-[r1:RULE_BOOK_ISSUE_CONSISTS_OF_SOLS]->(sl:Sol)
  CALL {
    WITH sl,r1
    MATCH (sl)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
    RETURN collect({sls:sls, lang: lang}) AS slState
  }
  WITH sl, slState, r1 order by r1.sol_ord
  RETURN collect({sol:sl, order: r1.sol_ord, sls: slState}) AS sl

}
RETURN MAX(rbi.rule_book_issue_no) as issue_no,  rbi, rbis, sl
ORDER BY issue_no DESC
LIMIT 1
`;

exports.searchRuleBook = `
Match (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)
WHERE toLower(rb.rule_book_id) CONTAINS toLower($rule_book_id)
CALL {
  WITH rbi
  MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
  RETURN collect({ rbis: rbis, lang: lang }) AS rbis
}
RETURN rb, rbi, rbis
ORDER BY $queryOrderBy
SKIP toInteger($skip)
LIMIT toInteger($limit)
`;
exports.searchRuleBookCount = `
Match (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)
WHERE toLower(rb.rule_book_id) CONTAINS toLower($rule_book_id)
RETURN count (rb) as count
`;
