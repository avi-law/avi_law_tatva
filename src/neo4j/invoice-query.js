exports.createInvoice = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE c.cust_id = $customerId and r1.to IS NULL
MATCH (cou1:Country) WHERE cou1.country_id = $country_id
CREATE (inv:Invoice $invoice)-[:INV_FOR_CUST]->(c)
MERGE (inv)-[:INV_SENT_FROM]->(cou1)
RETURN cou1`;

exports.logInvoice = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (inv:Invoice {inv_id_strg: $inv_id_strg})
CALL {
  WITH b
  OPTIONAL MATCH(b)<-[:LOG_FOR_USER]-(plog:Log)
  WHERE NOT (plog)<-[:USER_LOG_PREDECESSOR]-()
  WITH plog ORDER BY plog.log_timestamp DESC
  RETURN plog
  LIMIT 1
}
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(inv)
FOREACH (_ IN CASE WHEN plog IS NOT NULL AND l1 IS NOT NULL THEN [1] END | MERGE (plog)<-[:USER_LOG_PREDECESSOR]-(l1))`;

exports.cancelInvoice = `
MATCH (inv: Invoice {inv_id_strg: $inv_id_strg})
WHERE inv.inv_paid IS NULL AND inv.inv_cancelled IS NULL
SET inv.inv_cancelled = date()
RETURN inv`;

exports.getInvoice = `
MATCH (c:Customer)<-[:INV_FOR_CUST]-(inv:Invoice)
WHERE inv.inv_id_strg = $invoiceId AND c.cust_id = $customerId
RETURN inv as invoice`;

exports.paidInvoice = `
MATCH (inv:Invoice { inv_id_strg: $invoiceId })
SET inv.inv_paid = $currentDate
WITH inv
MATCH (inv)-[r1:INV_FOR_CUST]->(c)-[r2:HAS_CUST_STATE]->(cs)
WHERE r2.to IS NULL
SET cs.cust_paid_until = inv.inv_date_end
SET cs.cust_acc_until = inv.inv_date_end
RETURN inv, c, cs`;
