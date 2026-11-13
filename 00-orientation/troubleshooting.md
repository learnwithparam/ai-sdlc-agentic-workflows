# When something goes wrong

Every message a course command prints on failure is in this table. For example, if `bun run verify` says `There is no kestrel/ folder yet`, the second row tells you what to run.

| What you see                                                  | What it means                                             | Fix                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| `bun: command not found`                                      | Bun is not installed.                                     | Install it from bun.sh, then open a new terminal.                    |
| `There is no kestrel/ folder yet`                             | You have not made your Kestrel repo.                      | Run `bun run start meet-kestrel`.                                    |
| `There is no kestrel/ yet`                                    | The same: no Kestrel repo yet.                            | Run `bun run start meet-kestrel`.                                    |
| `There is no step called "..."`                               | The step name is misspelled.                              | Copy a name from the list it prints.                                 |
| `Name a step. Steps:`                                         | You left out the step name.                               | Add a name from the list, for example `bun run verify meet-kestrel`. |
| `There is no part called "..."`                               | The part name is misspelled.                              | Copy a name from the list it prints.                                 |
| `ERROR the check for ... could not load`                      | The check itself is broken, not your work.                | Open an issue with the full output.                                  |
| `doctor: Claude Code is not installed`                        | `claude` is not on your path.                             | Install it from the setup page, then open a new terminal.            |
| `doctor: Claude Code ... is too old`                          | Your Claude Code is older than the course needs.          | Run `claude update`.                                                 |
| `doctor: Claude Code is not signed in`                        | `claude auth status` says no.                             | Run `claude`, then type `/login`.                                    |
| `spoke is not running`                                        | `bun run world wrench` found no world.                    | Run `bun run world` in another terminal first.                       |
| `spoke said no: ...`                                          | The bike name is not in Kestrel's fleet.                  | Use a bike from `B-1000` to `B-3099`.                                |
| `spoke did not start`                                         | A check could not start the world.                        | Run `bun run world` and read its error.                              |
| `Only a person can approve. Claude Code may not run approve.` | Claude Code tried to sign a gate.                         | Run `bun run approve` yourself, in your own terminal.                |
| `Name the file to approve`                                    | You left out the file.                                    | For example: `bun run approve work/intent.md --role pm`.             |
| `Name a role with --role`                                     | The role is missing or misspelled.                        | Use one of `pm`, `tech-lead`, `qa`, `release-manager`, `em`.         |
| `There is no kestrel/... to approve`                          | The file is not there yet.                                | Ask Claude Code to write it first, then approve it.                  |
| `The step "..." has no recorded run`                          | That step does not use `bun run record`.                  | Check the step's README for its commands.                            |
| `There is no recorded run yet`                                | `bun run finished` found no recording and no Claude Code. | Install and sign in to Claude Code, or pull the latest course.       |
| `... links hold. The chain is broken.`                        | A gate, a test or the world contract failed.              | Read the `FAIL` lines above it.                                      |
