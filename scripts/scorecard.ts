// bun run scorecard: the goal, and how far your kestrel/ is from it.
// The goal is the last step, ship-the-feature. Every step before it adds one link to the chain.
import { existsSync } from "node:fs";
import { allSteps, parts, WORKSPACE } from "./structure";
import { run } from "./verify";

if (import.meta.main) {
  if (!existsSync(WORKSPACE)) {
    console.log("There is no kestrel/ yet. Run: bun run start meet-kestrel");
    process.exit(1);
  }
  console.log("The goal: bun run verify ship-the-feature passes on your kestrel/.");
  let passing = 0;
  for (const part of parts()) {
    if (part.steps.length === 0) console.log(`  ....  ${part.name} (being written)`);
    for (const step of part.steps) {
      const result = await run(step, WORKSPACE);
      if (result.status === "pass") passing++;
      console.log(`  ${result.status.toUpperCase().padEnd(4)}  ${part.name}: ${step.name}`);
    }
  }
  console.log(`Scorecard: ${passing} of ${allSteps().length} steps pass.`);
}
