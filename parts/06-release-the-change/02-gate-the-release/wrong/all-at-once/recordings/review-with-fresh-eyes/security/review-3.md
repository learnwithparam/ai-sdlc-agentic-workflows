# Vuln 1: SQL Injection: `src/crew-queue.ts:25`

* Severity: High
* Category: `sql_injection`
* Confidence: 10/10
* Description: The new `search` query parameter goes straight from `GET /crew/queue?search=...` (`src/server.ts:22`) into the SQL text with a template literal: `` ` AND fault LIKE '%${search}%'` ``. That string is added to the statement at `src/crew-queue.ts:28` and run with `database.query(...).all(depot)`. Only `depot` is bound as a parameter (`?1`). `search` is never bound or escaped. Every other query in the codebase uses `?` placeholders (`src/wrenches.ts`, `src/database.ts`, `src/feed.ts`), so this change breaks the project's existing safe pattern. `/crew/queue` needs no login, so anyone who can reach the service can exploit this.
* Exploit Scenario:
  * **Dump any table.** `repair_jobs` has 9 columns, so an attacker can use a UNION. For example, `/crew/queue?search=%25' UNION SELECT name,sql,1,1,1,'x','2026-01-01T00:00:00Z',1,NULL FROM sqlite_master--` returns the full schema. The same pattern reads every row of `wrenches`, `bikes`, `stations`, and closed or other-depot `repair_jobs`.
  * **Bypass the filters.** `search=' OR 1=1--` comments out the rest of the clause.
  * **Extract data blind.** Boolean or error-based payloads, for example `search=' AND (SELECT substr(sql,1,1) FROM sqlite_master)='C'--`, read data one character at a time.
  * **Limits.** `bun:sqlite` `.query()` compiles only the first statement, so stacked writes like `; DROP TABLE ...` are unlikely. The read-side breach of the whole database is still certain.
* Recommendation: Bind the search term as a parameter. Escape LIKE wildcards if crews should match the literal text:

  ```ts
  const jobs = database
    .query(
      `SELECT * FROM repair_jobs
       WHERE closed_at IS NULL
         AND (?1 IS NULL OR depot = ?1)
         AND (?2 IS NULL OR fault LIKE '%' || ?2 || '%' ESCAPE '\\')`,
    )
    .all(depot, search ? search.replace(/[\\%_]/g, "\\$&") : null) as JobRow[];
  ```

  Add a test that sends `'` and `' OR 1=1--` as `search` and checks that only matching open jobs come back.