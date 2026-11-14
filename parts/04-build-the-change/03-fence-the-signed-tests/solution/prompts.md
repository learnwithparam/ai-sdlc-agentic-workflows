# fence-the-signed-tests: the prompts, what Claude showed, what to check

The hooks in `solution/.claude/` were written by hand to match the prompt in the step page. The recorded run of the previous step stops at the signature. The check does not trust the settings file. It runs the registered command. It tries the edit hook on a `test/acceptance/` path and on a `src/` path. It tries the Stop hook on a tiny repo, first with a red test, then with a green one.

**Check before you accept:** the edit hook lets `src/` through. A hook that blocks every edit is the mistake in `wrong/hook-blocks-everything/`.
