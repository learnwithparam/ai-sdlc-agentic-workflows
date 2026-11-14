# Vuln 1: SQL injection: `src/crew-queue.ts:25`

* Severity: High
* Category: `sql_injection`
* Confidence: 9/10
* Description: `handleQueue` in `src/server.ts:22` takes the `search` value from the query string and passes it to `crewQueue` unchanged. On line 25, `crewQueue` places it inside a single-quoted `LIKE` string (`` ` AND fault LIKE '%${search}%'` ``), which becomes part of the SQL that runs at lines 26–30. `depot` in the same query is a bound parameter (`?1`), and every other query in the codebase is parameterized; `search` is not. The `/crew/queue` route has no authentication, so anyone who can reach the service can send input that becomes part of the SQL query.
* Exploit Scenario:
  - **Return every job:** `GET /crew/queue?search=%25'%20OR%201=1%20--` turns the query into `... AND fault LIKE '%%' OR 1=1 --%'`. This returns all repair jobs, including closed ones, from every depot.
  - **Read any table:** `repair_jobs` has 9 columns, so a 9-column `UNION SELECT` can read other tables. For example, `GET /crew/queue?search=x'%20UNION%20SELECT%20'a','b','c','d','e',sql,'2020-01-01T00:00:00Z','f',NULL%20FROM%20sqlite_master--` returns the full schema in the `fault` field. The same approach reads the `wrenches`, `bikes` and `stations` tables.
  - **Why the injected rows survive:** The 7th column (`reported_at`) must hold a valid date, or the deadline step after the query throws an error. The sort after that only reorders rows and never drops them.
  - **Limits:** bun:sqlite's `query()` compiles only one statement, so stacked writes like `; DROP TABLE` won't run. The attacker can still read the whole database, including any tables added later.
* Recommendation: Pass `search` as a bound parameter, and escape the LIKE wildcards so user input can't add `%` or `_` patterns:
  ```ts
  const jobs = database
    .query(
      "SELECT * FROM repair_jobs WHERE closed_at IS NULL AND (?1 IS NULL OR depot = ?1) " +
        "AND (?2 IS NULL OR fault LIKE '%' || ?2 || '%' ESCAPE '\\')",
    )
    .all(depot, search ? search.replace(/[\\%_]/g, "\\$&") : null) as JobRow[];
  ```

This was confirmed by reading the code only; the payloads above were not run against the server.