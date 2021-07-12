const { constants } = require("../utils");

exports.getUserHistoryLogs = `
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(log:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email}), (log)-[:LOG_REFERS_TO_OBJECT]->(obj)
WHERE lt.log_type_id IN [${constants.LOG_TYPE_ID.READ_RULE_BOOK},${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE},${constants.LOG_TYPE_ID.READ_NL}]
WITH *, collect(obj) as obj
WITH *,  apoc.coll.toSet(obj) as obj ORDER BY log.log_timestamp DESC SKIP toInteger($skip) LIMIT toInteger($limit)
CALL apoc.do.case([
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(obj[0])[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}",
    'MATCH (res:Rule_Element_State)<-[:HAS_RULE_ELEMENT_STATE]-(re:Rule_Element)
    WHERE id(res) = id(obj[0])
    MATCH (re),(rbi:Rule_Book_Issue),
    path = shortestPath((re)<-[:HAS_RULE_ELEMENT*]-(rbi))
    WITH *, re, path, MIN(length(path)) as minLength ORDER BY minLength ASC LIMIT 1
    WITH *, nodes(path)[minLength] as rbi
    MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
    WITH collect({ identity: id(obj[0]), rule_element_title: obj[0].rule_element_title, rule_element_article: obj[0].rule_element_article, rule_element_doc_id: re.rule_element_doc_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short, iso_639_1: lang.iso_639_1}) as data
    RETURN data',
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(obj[0])[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT}",
    'MATCH (res:Rule_Element_State)<-[:HAS_RULE_ELEMENT_STATE]-(re:Rule_Element)
    WHERE id(re) = id(obj[0])
    MATCH (re),(rbi:Rule_Book_Issue),
    path = shortestPath((re)<-[:HAS_RULE_ELEMENT*]-(rbi))
    WITH *, re, path, MIN(length(path)) as minLength ORDER BY minLength ASC LIMIT 1
    WITH *, nodes(path)[minLength] as rbi
    MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
    WITH collect({ identity: id(res), rule_element_title: res.rule_element_title, rule_element_article: res.rule_element_article, rule_element_doc_id: re.rule_element_doc_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short, iso_639_1: lang.iso_639_1}) as data
    RETURN data',
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_BOOK} AND LABELS(obj[0])[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_BOOK}",
    'MATCH (rb:Rule_Book { rule_book_id: obj[0].rule_book_id})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
    WITH collect({ identity: id(obj[0]), rule_book_id: rb.rule_book_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short, iso_639_1: lang.iso_639_1 }) as data
    RETURN data',
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_NL} AND LABELS(obj[0])[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.NL}",
    'MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
    WHERE id(nl) = id(obj[0])
    WITH collect({ nl: properties(nl), nls: { nl_title_short: nls.nl_title_short, nl_title_long: nls.nl_title_long }, iso_639_1: lang.iso_639_1 }) as data
    RETURN data'
],
"",
{ obj: obj })
YIELD value
WITH collect({ log: properties(log), lt: properties(lt), data: value.data }) as logs
RETURN logs
`;
exports.getUserHistoryLogsCount = `
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(log:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email}), (log)-[:LOG_REFERS_TO_OBJECT]-(obj)
WHERE lt.log_type_id IN [${constants.LOG_TYPE_ID.READ_RULE_BOOK},${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE},${constants.LOG_TYPE_ID.READ_NL}]
WITH *, collect(obj) as obj
WITH *,  apoc.coll.toSet(obj) as obj ORDER BY log.log_timestamp DESC
RETURN count(log) as count
`;

exports.userCreateFavorite = `
MATCH (u:User {user_email: $user_email })
OPTIONAL MATCH (u)-[r1:USER_HAS_FAVORITE]->()
WHERE r1.order IS NOT NULL
WITH u, MAX( r1.order) + 1 AS next_order
MATCH (res:Rule_Element_State) WHERE id(res) IN $identity
FOREACH (_ IN CASE WHEN res IS NOT NULL AND u IS NOT NULL THEN [1] END | MERGE (u)-[:USER_HAS_FAVORITE { order: next_order }]->(res))
RETURN res, u
`;

exports.userDeleteFavorite = `
MATCH (u:User {user_email: $user_email })
MATCH (res:Rule_Element_State) WHERE id(res) IN $identity
OPTIONAL MATCH (u)-[r1:USER_HAS_FAVORITE]->(res)
FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | DELETE r1)
RETURN res, u
`;

exports.userCreateFavoriteRuleBook = `
MATCH (u:User {user_email: $user_email })
OPTIONAL MATCH (u)-[r1:USER_HAS_FAVORITE]->()
WHERE r1.order IS NOT NULL
WITH u, MAX( r1.order) + 1 AS next_order
MATCH (rb:Rule_Book) WHERE id(rb) IN $identity
FOREACH (_ IN CASE WHEN rb IS NOT NULL AND u IS NOT NULL THEN [1] END | MERGE (u)-[:USER_HAS_FAVORITE { order: next_order }]->(rb))
RETURN rb, u
`;

exports.userDeleteFavoriteRuleBook = `
MATCH (u:User {user_email: $user_email })
MATCH (rb:Rule_Book) WHERE id(rb) IN $identity
OPTIONAL MATCH (u)-[r1:USER_HAS_FAVORITE]->(rb)
FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | DELETE r1)
RETURN rb, u
`;

exports.getUserFavorites = `
MATCH (u:User {user_email: $user_email })-[r1:USER_HAS_FAVORITE]->(obj)
WITH *, collect(obj) as obj ORDER BY r1.order DESC
CALL apoc.do.case([
  LABELS(obj[0]) = ["${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}"],
    'MATCH (lang:Language)<-[:RULE_ELEMENT_STATE_LANGUAGE_IS]-(res:Rule_Element_State)<-[:HAS_RULE_ELEMENT_STATE]-(re:Rule_Element)
    WHERE id(res) = id(obj[0])
    OPTIONAL MATCH (res)-[r:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(resv:Rule_Element_State)
    MATCH (re),(rbi:Rule_Book_Issue),
    path = shortestPath((re)<-[:HAS_RULE_ELEMENT*]-(rbi))
    WITH *, re, path, MIN(length(path)) as minLength ORDER BY minLength ASC LIMIT 1
    WITH *, nodes(path)[minLength] as rbi
    MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang)
    WITH collect({ favIdentity: id(r1), favOrder: r1.order, minLength: minLength, favoriteType: LABELS(obj[0])[0], identity: id(obj[0]), version_of_id: id(resv), res:{ rule_element_title: obj[0].rule_element_title, rule_element_article: obj[0].rule_element_article, rule_element_doc_id: re.rule_element_doc_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short }, iso_639_1: lang.iso_639_1}) as data
    RETURN data',
  LABELS(obj[0]) = ["${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_BOOK}"],
    'MATCH (rb:Rule_Book { rule_book_id: obj[0].rule_book_id})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
    WITH collect({ favIdentity: id(r1), favOrder: r1.order, favoriteType: LABELS(obj[0])[0], identity: id(obj[0]), rb: {rule_book_id: rb.rule_book_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short}, iso_639_1: lang.iso_639_1 }) as data
    RETURN data'
],
"",
{ obj: obj, r1: r1})
YIELD value as favorites
RETURN favorites.data as favorites
`;
