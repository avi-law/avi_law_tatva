exports.searchSolQueryCount = (condition = "") => `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)
${condition}
RETURN count (distinct sl) as count`;

exports.searchSolQuery = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "sl.sol_date DESC"
) => `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
${condition}
WITH sl, cou, lang, sls order by ${orderBy}
RETURN sl, cou, collect({ sls: sls, lang: lang }) as sls
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.searchNLQuery = (queryParams) => {
  let nlCountry = "";
  if (queryParams.country && queryParams.country.length > 0) {
    queryParams.country.forEach((ln) => {
      nlCountry = `${nlCountry}, "${ln.toUpperCase()}"`;
    });
  }
  let query = `
  MATCH (nls:Nl_State)<-[:HAS_NL_STATE]-(nl:Nl)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
  MATCH (nls)-[r3:NL_LANG_IS]->(lang:Language)
  WHERE nl.nl_active = true
  `;
  if (queryParams.lang) {
    query = `${query} AND lang.iso_639_1 = "${queryParams.lang}"`;
  }
  if (queryParams.country) {
    nlCountry = nlCountry.replace(/^,|,$/g, "");
    query = `${query} AND cou.iso_3166_1_alpha_2 IN [${nlCountry}]`;
  }
  if (queryParams.text) {
    query = `${query} AND (toLower(nls.nl_text) CONTAINS toLower("${queryParams.text}") OR toLower(nls.nl_title_long) CONTAINS toLower("${queryParams.text}") OR toLower(nls.nl_title_short) CONTAINS toLower("${queryParams.text}"))`;
  }
  query = `${query}
  CALL {
    WITH nls
    MATCH (nls)-[:NL_LANG_IS]->(lang:Language)
    RETURN collect({ nls: nls, lang: lang }) AS nlState
  }
  RETURN nl, nlState as nls, cou
  ORDER BY nl.nl_date DESC, nl.nl_ord DESC`;

  return query;
};

exports.searchRuleElementQuery = (queryParams) => {
  let query = `
  MATCH (res:Rule_Element_State)-[:RULE_ELEMENT_STATE_LANGUAGE_IS]-(lang:Language)
  WHERE (toLower(res.rule_element_text) CONTAINS toLower("${queryParams.text}") OR toLower(res.rule_element_title) CONTAINS toLower("${queryParams.text}") OR toLower(res.rule_element_rmk) CONTAINS toLower("${queryParams.text}") ) `;

  if (queryParams.lang) {
    query = `${query}
    AND lang.iso_639_1 = "${queryParams.lang}"`;
  }
  query = `${query}
  MATCH (res)<-[:HAS_RULE_ELEMENT_STATE]-(re:Rule_Element)<-[:HAS_RULE_ELEMENT*]-(rbi:Rule_Book_Issue)
  MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang)
  OPTIONAL MATCH (res)-[:RULE_ELEMENT_STATE_LANGUAGE_VERSION_OF]->(res3)
  RETURN
    {
      re: {
        rule_element_id: re.rule_element_id,
        rule_element_is_rule_book: re.rule_element_is_rule_book,
        rule_element_header_lvl: re.rule_element_header_lvl,
        rule_element_doc_id: re.rule_element_doc_id
      },
      rbis: {
        rule_book_issue_title_short: rbis.rule_book_issue_title_short
      },
      identity: id(res),
      rule_element_show_anyway: res.rule_element_show_anyway,
      rule_element_applies_from: res.rule_element_applies_from,
      rule_element_in_force_until: res.rule_element_in_force_until,
      rule_element_applies_until: res.rule_element_applies_until,
      rule_element_in_force_from: res.rule_element_in_force_from,
      rule_element_visible_until: res.rule_element_visible_until,
      rule_element_visible_from: res.rule_element_visible_from,
      rule_element_title: res.rule_element_title,
      rule_element_article: res.rule_element_article,
      rule_element_state_language_version_identity: id(res3),
      rule_element_state_langauge: lang.iso_639_1
    } as res`;
  return query;
};
