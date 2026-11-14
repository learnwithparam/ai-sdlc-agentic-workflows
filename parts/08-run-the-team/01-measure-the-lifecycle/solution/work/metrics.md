# Metrics: spoke lifecycle numbers

Run every command from the repo root. In the raw file, `\|` inside a table cell is how GitHub
markdown writes a `|`, so type a plain `|` when you copy a command into a shell. The time maths
uses `awk mktime`, which reads local time, so run it with `TZ=UTC` (the shell this was run in was
already UTC).

## DORA keys (data/deploys.csv, data/incidents.csv)

| Key                   | Value                                                        | Command                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deployment frequency  | 69 deploys in total, over 25.71 weeks = **2.68 per week**    | `awk -F, 'NR>1{n++; t=$5; gsub(/[-:TZ]/," ",t); s=mktime(t); if(!f\|\|s<f)f=s; if(s>l)l=s} END{w=(l-f)/604800; printf "%d deploys over %.2f weeks = %.2f per week\n", n, w, n/w}' data/deploys.csv`                                                                       |
| Lead time for changes | **66.02 h** median, committed_at to deployed_at (69 deploys) | `awk -F, 'NR>1{a=$4;b=$5; gsub(/[-:TZ]/," ",a); gsub(/[-:TZ]/," ",b); print (mktime(b)-mktime(a))/3600}' data/deploys.csv \| sort -n \| awk '{v[NR]=$1} END{printf "%d deploys, median lead time %.2f h\n", NR, (NR%2 ? v[(NR+1)/2] : (v[NR/2]+v[NR/2+1])/2)}'`           |
| Change failure rate   | 9 of 69 deploys have an incident_id = **13.0%**              | `awk -F, 'NR>1{n++; if($6!="")c++} END{printf "%d of %d = %.1f%%\n", c, n, 100*c/n}' data/deploys.csv`                                                                                                                                                                    |
| Time to restore       | **3.52 h** median, started_at to resolved_at (9 incidents)   | `awk -F, 'NR>1{a=$3;b=$4; gsub(/[-:TZ]/," ",a); gsub(/[-:TZ]/," ",b); print (mktime(b)-mktime(a))/3600}' data/incidents.csv \| sort -n \| awk '{v[NR]=$1} END{printf "%d incidents, median time to restore %.2f h\n", NR, (NR%2 ? v[(NR+1)/2] : (v[NR/2]+v[NR/2+1])/2)}'` |

The CSVs stop at D-069 (deployed 2026-10-31). D-071, the 2026-11-03 North double wrench
(`data/incidents/north-double-wrench/deploys.log`), is in neither file, so it is not counted in
the change failure rate or the time to restore.

## This feature (git, root commit 49f8c54 up to and including 646c214)

646c214 is "approve: work/intent/next-dedupe-wrenches.md by pm" and is `HEAD`, so the range is all
17 commits on the branch.

| Measure                                      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Command                                                                                                                                                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent to spec                               | **0.00 h**. The first commit to change `work/intent.md` and the first to change `work/spec.md` are the same commit, 49f8c54 "Begin build: the plan is approved".                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `git log --format='%at %H' --name-only 646c214 \| awk 'NF==2{t=$1; next} $0=="work/intent.md"{i=t} $0=="work/spec.md"{s=t} END{printf "%.2f h\n", (s-i)/3600}'`                                                                                           |
| Spec commits after the first plan commit     | **0**. The first plan commit is 49f8c54 (`git log --format=%h 646c214 -- work/plan.md \| tail -1`), and no later commit touches `work/spec.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `git rev-list --count 49f8c54..646c214 -- work/spec.md`                                                                                                                                                                                                   |
| Files outside plan.md                        | **12**: test/acceptance/ac-10-open-jobs-at-launch.test.ts, test/acceptance/ac-11-depot-filter.test.ts, test/acceptance/ac-12-feed-freshness.test.ts, test/acceptance/ac-13-other-bikes-untouched.test.ts, test/acceptance/ac-2-wrench-records-atomically.test.ts, test/acceptance/ac-3-station-available-drops.test.ts, test/acceptance/ac-4-station-disabled-rises.test.ts, test/acceptance/ac-5-map-matches-feed.test.ts, test/acceptance/ac-6-second-wrench-no-change.test.ts, test/acceptance/ac-7-unknown-bike-404.test.ts, test/acceptance/ac-8-deadline-from-report.test.ts, test/acceptance/ac-9-due-first-on-top.test.ts | `git log --format='@%s' --name-only 646c214 \| awk '/^@/{p=/^@P-/;next} p&&NF' \| sort -u \| awk 'NR==FNR{t=t $0 "\n"; next} index(t,$0)==0' work/plan.md - \| wc -l` (drop `\| wc -l` to print the list)                                                 |
| Share of commits with Co-Authored-By: Claude | 11 of 17 = **64.7%**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `git log --format='%(trailers:key=Co-Authored-By,valueonly,separator=;)' 646c214 \| awk '{n++} /^Claude/{c++} END{printf "%d of %d = %.1f%%\n", c, n, 100*c/n}'`                                                                                          |
| Median commit size                           | **21.5** lines added plus deleted, over 16 commits (root 49f8c54 skipped)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `git log --reverse --format='@%h' --numstat 646c214 \| awk '/^@/{n++; next} NF==3 && n>1{s[n]+=$1+$2} END{for(i=2;i<=n;i++) print s[i]+0}' \| sort -n \| awk '{a[NR]=$1} END{print NR, "commits, median", (NR%2 ? a[(NR+1)/2] : (a[NR/2]+a[NR/2+1])/2)}'` |

Notes on how these were counted:

- Files outside plan.md: the plan names the P-1 test files as
  `test/acceptance/ac-1-wrench-disables-bike.test.ts` … `ac-13-other-bikes-untouched.test.ts` and
  lists the rest by short name only, so only `ac-1` and `helpers.ts` appear as full paths. The 12
  are files the plan describes but does not spell out. They are not unplanned work.
- Co-Authored-By: the trailer is counted, not the author. Commits 68e43cb and 0467f54 are
  authored by `Claude` but have no trailer, so they are not in the 11. Seven of the 11 say
  `Claude Opus 5.5`; the other four say `Claude`.
- Commit size: c0913af (P-1 acceptance tests, 508 lines) is the biggest. Two commits (0467f54,
  68e43cb) are empty.
- Author dates are out of order: a677d60 is dated 2026-11-13 16:00, but it sits after commits
  dated 2026-11-14. "First" here means first in commit order. For intent to spec this changes
  nothing, because both files first appear in the root commit.

## What these numbers do not prove

**One comparison.** Our median lead time for changes is 66.02 h, about 2.75 days. The DORA
reports put elite teams under one day and high performers between one day and one week. That
places spoke in the high band, not the elite one. Change failure rate (13.0%) and time to restore
(3.52 h, under a day) look about the same. These are bands from a survey of many organisations. They
are not a target, and we measured our numbers differently from how the survey asked for them
(our data is commit and deploy timestamps, theirs is what people said).

**What one feature cannot show.**

- The feature numbers come from 17 commits. A median of 21.5 lines, or a 64.7% Claude share, from
  one feature is one sample, not a trend. A different feature (for example, one with a schema
  change) could look nothing like it.
- 0.00 h intent to spec and 0 spec commits after the plan do not mean the spec was written
  instantly or was perfect. The repo starts at "Begin build: the plan is approved", so intent,
  spec and plan were all written before the history begins. The git history cannot see that work.
- The trailer count measures who was credited, not who did how much of the work or how good it was.
  It also cannot tell us whether Claude made the team faster. METR's work on AI task time horizons
  and its randomised trial with experienced developers measured task length and speed under
  controlled conditions. Nothing here has a control group, so we cannot claim a speed-up or a
  slow-down.
- None of the feature's code is in the DORA data yet: data/deploys.csv ends at D-069 on
  2026-10-31. Whether this feature changed lead time, failure rate or restore time will only show
  after it ships and enough deploys pile up after it. Even then, one feature is too few to
  separate its effect from noise.
- The North double wrench (D-071) is not in data/incidents.csv. Until it is added, the change
  failure rate and time to restore look better than they really are.
