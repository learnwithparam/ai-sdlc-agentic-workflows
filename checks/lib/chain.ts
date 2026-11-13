// The lifecycle chain: every stage's file, in order, and the role whose approval opens the next.
// The finished system and the Goal check both walk this list.
export type Gate = { stage: string; file: string; role: string };

export const CHAIN: Gate[] = [
  { stage: "Plan", file: "work/intent.md", role: "pm" },
  { stage: "Design", file: "work/spec.md", role: "pm" },
  { stage: "Design", file: "work/decisions/0001-disable-in-feed.md", role: "tech-lead" },
  { stage: "Build", file: "work/plan.md", role: "tech-lead" },
  { stage: "Build", file: "test/acceptance", role: "qa" },
  { stage: "Review", file: "REVIEW.md", role: "tech-lead" },
  { stage: "Release", file: "work/release.md", role: "pm" },
  { stage: "Release", file: "work/rollout.yaml", role: "release-manager" },
  { stage: "Maintain", file: "work/postmortem.md", role: "tech-lead" },
  { stage: "Maintain", file: "work/intent/next-dedupe-wrenches.md", role: "pm" },
  { stage: "Team", file: "PLAYBOOK.md", role: "em" },
];
