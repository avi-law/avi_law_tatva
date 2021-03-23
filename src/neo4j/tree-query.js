exports.getRuleBooksStructure = `
MATCH (rbs0:Rule_Book_Struct {rule_book_struct_id:"Rule Root Object"})
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
				RETURN collect(rbi {.rule_book_issue_no}) AS res_rbi
			}

			WITH path, nodes(path) AS n, res_rbi, apoc.text.rpad(reduce(a = "", r in relationships(path) | a + apoc.text.lpad(toString(COALESCE(r.order_rule_book_child,0)),4,"0")),100,"0") AS orders
              RETURN n[-1] AS res_rbs, n[-2] AS res_rbs_parent, res_rbi ORDER BY orders
        	}
		RETURN collect(res_rbs {.rule_book_id, .rule_book_active, rule_book_parent_id: res_rbs_parent.rule_book_id, res_rbi}) AS rbs_res
    	}
	RETURN n[-1] AS res_rbss, n[-2] AS res_rbss_parent, res_desc_lang, rbs_res ORDER BY orders
}
RETURN res_rbss {.rule_book_struct_id, .rule_book_struct_active, rule_book_struct_parent_id: res_rbss_parent.rule_book_struct_id, res_desc_lang} AS rbss_res, rbs_res
`;
