# Prompts for the OpenFeature rollout

## Prompt 1

Read work/rollout.yaml in kestrel/. Which district is the first stage? Do not change anything yet.

## Prompt 2

Edit only assignment/flags/flagd.json. Keep wrench_disables_bike off by default. Add targeting so a user whose district is North reads on, and everyone else reads off. Show me the diff before you save.

## What I checked

The diff touched one file. The default stayed off. The district in the rule is North, the first stage of the plan.

## What I rejected

Claude Code first proposed setting the default variant to on and listing the other districts as off. I rejected it, because a new district would then be on by accident.
