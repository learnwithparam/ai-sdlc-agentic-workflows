# Vuln 1: SQL Injection: `src/crew-queue.ts:25`

* Severity: High
* Category: `sql_injection`
* Confidence: 10/10
* Description: The new `search` query parameter is read from `GET /crew/queue?search=...` in `src/server.ts:62` and passed to `crewQueue`. There it is pasted straight into the SQL text: `` ` AND fault LIKE '%${search}%'` ``. That string becomes part of the statement run by `database.query(...)` at lines 27-30. Nothing escapes or binds the value. The route needs no login (`src/server.ts:73`). Every other query in the codebase binds its values with `?` placeholders, as the `depot` filter on the same line does with `?1`, so this change breaks the project's established pattern.
* Exploit Scenario: Anyone who can reach the service can send a request with no credentials:
  - `GET /crew/queue?search=%25' OR 1=1 OR fault LIKE '` gets past both the `closed_at IS NULL` and the depot filter, and returns every repair job, closed ones included, for every depot.
  - `GET /crew/queue?search=' UNION SELECT name,sql,NULL,NULL,NULL,NULL,NULL,NULL,NULL FROM sqlite_master--` lists the schema. `repair_jobs` has 9 columns, so a 9-column `UNION` lines up.
  - The same `UNION SELECT` method then reads any table in the shared SQLite file, such as `wrenches`, `bikes` and `stations`. The rows come back in the JSON response. (`reported_at` must hold a parseable date in the injected rows, or `contractDeadline` throws.)

  The data leaks out with no authentication at all.
* Recommendation: Bind the search term as a parameter and escape the LIKE wildcards:
  ```ts
  const jobs = database
    .query(
      "SELECT * FROM repair_jobs WHERE closed_at IS NULL AND (?1 IS NULL OR depot = ?1) " +
        "AND (?2 IS NULL OR fault LIKE '%' || ?2 || '%' ESCAPE '\\')",
    )
    .all(depot, search ? search.replace(/[\\%_]/g, (c) => "\\" + c) : null) as JobRow[];
  ```
  Also add a test that sends a search containing `'` and checks that the result is limited to open jobs.