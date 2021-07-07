const { constants } = require("../utils");

exports.getUserHistoryLogsOld = `
MATCH (log:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email})
WHERE NOT (log)<-[:USER_LOG_PREDECESSOR]-(:Log)
WITH log
MATCH (log:Log)-[:USER_LOG_PREDECESSOR*0..19]->(log3:Log)-[:LOG_REFERS_TO_OBJECT]-(obj)
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(log3)
WITH collect({ log: properties(log3), lt: properties(lt), data: obj }) as logs
RETURN logs
`;
exports.getUserHistoryLogs = `
MATCH (log:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email})
WHERE NOT (log)<-[:USER_LOG_PREDECESSOR]-(:Log)
WITH log
MATCH (log:Log)-[:USER_LOG_PREDECESSOR*0..19]->(log3:Log)-[:LOG_REFERS_TO_OBJECT]-(obj)
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(log3)
WITH *, collect(obj) as obj
CALL apoc.do.case([
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(obj[0])[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}",
    'MATCH (res:Rule_Element_State)<-[:HAS_RULE_ELEMENT_STATE]-(re:Rule_Element)<-[:HAS_RULE_ELEMENT*]-(rbi:Rule_Book_Issue)
    WHERE id(res) = id(obj[0])
    MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
    WITH collect({ identity: id(obj[0]), rule_element_title: obj[0].rule_element_title, rule_element_article: obj[0].rule_element_article, rule_element_doc_id: re.rule_element_doc_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short, iso_639_1: lang.iso_639_1}) as data
    RETURN data',
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_BOOK} AND LABELS(obj[0])[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_BOOK}",
    'MATCH (rb:Rule_Book { rule_book_id: obj[0].rule_book_id})-[:HAS_RULE_BOOK_ISSUE]->(rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
    WITH collect({ identity: id(obj[0]), rule_book_id: rb.rule_book_id, rule_book_issue_title_short: rbis.rule_book_issue_title_short, iso_639_1: lang.iso_639_1 }) as data
    RETURN data'
],
null,
{ obj: obj })
YIELD value
WITH collect({ log: properties(log3), lt: properties(lt), data: value.data }) as logs
RETURN logs
`;
