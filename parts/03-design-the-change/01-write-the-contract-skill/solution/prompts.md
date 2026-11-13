# write-the-contract-skill: the prompts, what Claude showed, what to check

Every file here came from a real Claude Code run. The authoring transcripts are in `parts/03-design-the-change/recordings/write-the-contract-skill/`. The three test runs are in `recordings/write-the-contract-skill/` in this folder.

## Prompt 1

The prompt in the step's README. Claude Code read the contract and wrote `SKILL.md` with six numbered rules. Its description starts "Kestrel's service-level contract with Brannock City Transport. Use whenever you write a spec, a plan, a test or code that touches wrench reports...".

**Check before you say yes:** the description names the jobs, not only the topic. Each rule matches a line of `data/contract/sla.yaml`. The last rule says what to do on a conflict.

**One change after the run:** `bun run format` put a blank line after the first `---`. The three test runs were recorded with the formatted file, and the skill still loaded each time.

## The test runs

`bun run record write-the-contract-skill` asks Claude Code to draft a spec for "the app shows the rider when a crew must fix it". In all 3 runs, the first thing Claude Code did was call the `Skill` tool for `city-contract`. Then it read the contract and the code.

## The weak prompts

`wrong/vague-description/` came from a prompt that set the description to "Notes about data/contract/sla.yaml." Claude Code warned that the skill "may rarely load". It was right: in 3 test runs, it never loaded.

`wrong/reference-not-rules/` came from a short prompt. It asked Claude Code to save the contract as a skill "so Claude knows it". Claude Code wrote a careful copy of the contract, and it loaded in 3 of 3 runs. But its description says "Use before changing or reviewing anything", not when writing a spec. And it never says what to do when a request conflicts with the contract. A skill that only describes the contract will not stop the grace period in the next step.

## What to reject

- A description that names the topic but not the job.
- A rule that copies a number from the contract into the skill with no reason. The skill says why. The contract stays the source of truth.
