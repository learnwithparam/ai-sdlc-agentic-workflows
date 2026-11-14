# Prompts for ship-in-your-own-repo

This step has no sample code. Your own repo is the example. Open Claude Code in it, not in `kestrel/`.

Prompt 1, in plan mode:

```text
Read this repo and suggest three small features, each one a change to one or two files. Do not
edit anything. Say how I would test each one.
```

Pick the smallest. Then ask for a short spec with two acceptance lines in the form WHEN ... THEN ...

Prompt 2:

```text
Write the failing tests for AC-1 and AC-2. Run them and show me they fail. Then build the feature in
small commits. Run the tests after each commit.
```

Prompt 3, in a fresh session:

```text
Review the last commits against the spec. Say what is Important and what is a nit. Do not edit.
```

Then copy the facts into `work/own-feature.md` in `kestrel/`. Use `git log` in your repo for the commit id, and paste the real test output line.

What to check: the commit id exists in your repo, the test line is real output, and no word in the file comes from Kestrel.
What to reject: a file full of Kestrel words, or a made-up commit id.
