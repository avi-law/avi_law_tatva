exports.getRuleBooksStructure = `
MATCH (rbs0:Rule_Book_Struct {rule_book_struct_id: $rule_book_struct_id})
CALL {
  WITH rbs0
  CALL apoc.path.expandConfig(rbs0, {relationshipFilter: "HAS_RULE_BOOK_STRUCT_CHILD>"})
      YIELD path
      CALL {
          WITH path
          WITH nodes(path)[-1] AS rbs
          MATCH (rbs)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss:Rule_Book_Struct_State)
          CALL {
              WITH rbss
              MATCH (rbss)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]-(lang:Language)
              RETURN lang
          }
        WITH rbss, lang
        RETURN collect(rbss {.rule_book_struct_desc, language: lang.iso_639_1}) AS res_desc_lang
      }
    WITH path, nodes(path) AS n, res_desc_lang, apoc.text.rpad(reduce(a = "", r in relationships(path) | a + apoc.text.lpad(toString(COALESCE(r.order_rule_book_struct,0)),4,"0")),100,"0") AS orders
      CALL {
          WITH n
          WITH n[-1] AS m
          MATCH (m)<-[r1:RULE_BOOK_BELONGS_TO_STRUCT]-(rb:Rule_Book)
          WITH rb, rb {.rule_book_id, .rule_book_active} AS rb2 order by r1.order_rule_book_in_struct
          CALL {
              WITH rb
              CALL apoc.path.expandConfig(rb, {relationshipFilter: "HAS_RULE_BOOK_CHILD>"})
              YIELD path
              CALL {
                WITH path
                WITH nodes(path)[-1] as rb
                MATCH (rb)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)
                WITH rbi ORDER BY rbi.rule_book_issue_no
                CALL {
                  WITH rbi
                  MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
                  RETURN rbis, lang
                }
              RETURN collect(rbi {.rule_book_issue_no, title_short: rbis.rule_book_issue_title_short, title_long: rbis.rule_book_issue_title_long, language: lang.iso_639_1, label: labels(rbi)}) AS res_rbi
            }
          WITH path, nodes(path) AS n, res_rbi, apoc.text.rpad(reduce(a = "", r in relationships(path) | a + apoc.text.lpad(toString(COALESCE(r.order_rule_book_child,0)),4,"0")),100,"0") AS orders
          RETURN n[-1] AS res_rbs, n[-2] AS res_rbs_parent, res_rbi ORDER BY orders
        }
      RETURN collect(res_rbs {.rule_book_id, .rule_book_active, rule_book_parent_id: res_rbs_parent.rule_book_id, res_rbi, label: labels(res_rbs)}) AS rbs_res
    }
  RETURN n[-1] AS res_rbss, n[-2] AS res_rbss_parent, res_desc_lang, rbs_res ORDER BY orders
}
RETURN res_rbss {.rule_book_struct_id, .rule_book_struct_active, rule_book_struct_parent_id: res_rbss_parent.rule_book_struct_id, res_desc_lang, label: labels(res_rbss)} AS rbss_res, rbs_res
`;

exports.getRuleBookTreeStructure = `
MATCH (rb:Rule_Book {rule_book_id: $rule_book_id })
WITH rb, rb {.rule_book_id, .rule_book_active} AS rb2
CALL {
      WITH rb
      CALL apoc.path.expandConfig(rb, {relationshipFilter: "HAS_RULE_BOOK_CHILD>"})
      YIELD path

CALL {
WITH path
WITH nodes(path)[-1] as rb
MATCH (rb)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)
WITH rbi ORDER BY rbi.rule_book_issue_no
CALL {
WITH rbi
MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
RETURN rbis, lang
}
RETURN collect(rbi {.rule_book_issue_no, title_short: rbis.rule_book_issue_title_short, title_long: rbis.rule_book_issue_title_long, language: lang.iso_639_1, label: labels(rbi)}) AS res_rbi
}

WITH path, nodes(path) AS n, res_rbi, apoc.text.rpad(reduce(a = "", r in relationships(path) | a + apoc.text.lpad(toString(COALESCE(r.order_rule_book_child,0)),4,"0")),100,"0") AS orders
    RETURN n[-1] AS res_rbs, n[-2] AS res_rbs_parent, res_rbi ORDER BY orders
}
RETURN collect(res_rbs {.rule_book_id, .rule_book_active, rule_book_parent_id: res_rbs_parent.rule_book_id, res_rbi, label: labels(res_rbs)}) AS rbs_res
`;

exports.getRuleBookIssueTreeStructure = `
MATCH (Rule_Book {rule_book_id: $rule_book_id)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)
WITH rbi ORDER BY rbi.rule_book_issue_no
CALL {
WITH rbi
MATCH (rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
RETURN rbis, lang
}
RETURN collect(rbi {.rule_book_issue_no, title_short: rbis.rule_book_issue_title_short, title_long: rbis.rule_book_issue_title_long, language: lang.iso_639_1, label: labels(rbi)}) AS res_rbi
`;

exports.getRulesElementTreeStructure1 = `
  MATCH (rb:Rule_Book {rule_book_id: $rule_book_id })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue
  {rule_book_issue_no: $rule_book_issue_no })
  WITH rbi
  CALL apoc.path.expandConfig(rbi, {relationshipFilter: "HAS_RULE_ELEMENT>"})
   YIELD path

  WITH path, nodes(path) AS n, apoc.text.rpad(reduce(a = "", r in relationships(path) | a +
  apoc.text.lpad(toString(COALESCE(r.order,0)),6,"0")),120,"0") AS orders
  WITH n[-1] AS element_node ORDER BY orders
  WITH collect(element_node) AS element_nodes
  RETURN element_nodes[0] as rule_book_issue, element_nodes[1..] as rule_element
`;
exports.getRulesElementTreeStructure = `
MATCH path = (rb:Rule_Book {rule_book_id: $rule_book_id})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue {rule_book_issue_no: $rule_book_issue_no})-[:HAS_RULE_ELEMENT*]->(re:Rule_Element)
WITH path, nodes(path) AS n, apoc.text.rpad(reduce(a = "", r in relationships(path) | a + apoc.text.lpad(toString(COALESCE(r.order,0)),6,"0")),120,"0") AS orders
WITH path AS path_ordered order by orders
WITH Collect(path_ordered) AS path_elements
CALL apoc.convert.toTree(path_elements) yield value
RETURN value as rule_book;
`;

exports.getRuleElementStateTreeStructure = `
MATCH path = (rb:Rule_Book {rule_book_id: $rule_book_id})-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element)-[:HAS_RULE_ELEMENT_STATE]->(:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]->(lang:Language)
WHERE rbi.rule_book_issue_no = MAX(rbi.rule_book_issue_no)
WITH path, nodes(path) AS n, apoc.text.rpad(reduce(a = "", r in relationships(path) | a + apoc.text.lpad(toString(COALESCE(r.order,0)),6,"0")),120,"0") AS orders
WITH path AS path_ordered order by orders
WITH Collect(path_ordered) AS path_elements
CALL apoc.convert.toTree(path_elements, true, {
  nodes: {
    Language: ['iso_639_1'],
    Rule_Element: ['rule_element_id','rule_element_is_rule_book','rule_element_header_lvl','rule_element_doc_id'],
    Rule_Element_State: ['rule_element_show_anyway','rule_element_applies_from','rule_element_in_force_until','rule_element_applies_until','rule_element_in_force_from','rule_element_visible_until','rule_element_visible_from','rule_element_title', 'rule_element_article']
  }
}) yield value
RETURN value as rule_book;
`;
