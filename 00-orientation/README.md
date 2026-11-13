# Start here: meet Kestrel

In this part you get Claude Code ready, meet Kestrel's world, run the finished chain and name your goal. It takes about 15 minutes.

```mermaid
flowchart LR
  A[Install Claude Code<br/>and sign in] --> B[bun run doctor]
  B --> C[bun run world:<br/>see the bug]
  C --> D[bun run finished:<br/>see the end]
  D --> E[notes/goal.md:<br/>name your goal]
```

## Get Claude Code

Claude Code is the tool you use for every step. Install it the official way, from the [setup page](https://code.claude.com/docs/en/setup.md). On macOS, Linux or WSL, the native installer is one line:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Expect: the installer ends by printing where it put `claude`.

Then sign in. Run `claude`, type `/login` and follow the steps. A Claude plan or an API key for Claude Code both work. Then check the version:

```bash
claude --version
```

Expect: a version of `2.1.302` or newer, for example `2.1.323 (Claude Code)`.

**No terminal habit?** You can use Claude Desktop instead. Download it, sign in, open the **Code** tab and pick the `kestrel` folder. Every prompt in this course works there too. You still type the `bun run` commands in a terminal, and each one has an `Expect:` line.

## Walkthrough

Make your own Kestrel repo. It goes in `kestrel/`, with its own git history:

```bash
bun run start meet-kestrel
```

Expect: `kestrel/ is ready at the start of meet-kestrel.`

Check that your machine is ready:

```bash
bun run doctor
```

Expect: `doctor: Claude Code 2.1.323, signed in, Bun 1.4.4, world ready`, with your own version numbers.

Start the world. Keep this terminal open:

```bash
bun run world
```

Expect: `spoke is running on http://localhost:4100`

Open http://localhost:4100. You see Brannock's 180 stations. A red number is how many broken bikes wait at a station.

![Kestrel's map: each dot is a station, each red number is broken bikes waiting there](images/kestrel-map.png)

In a second terminal, report a broken bike, the way a rider does with the wrench button:

```bash
bun run world wrench B-2207
```

Expect: `The public feed shows B-2207 with is_disabled: false.`

That is the bug. The rider said the bike is broken, and the public feed still offers it to the next rider. For example, the city contract in `kestrel/data/contract/sla.yaml` says the feed must be accurate "at all times".

Now see the end of the course. Stop the world with Ctrl+C first:

```bash
bun run finished --replay
```

Expect: `The finished chain holds: 11 gates, tests pass, world contract passes.`

See how far you are from the goal:

```bash
bun run scorecard
```

Expect: a line per step, then `Scorecard: 0 of 2 steps pass.` The count grows as the parts are written.

Now do the step: [meet-kestrel](meet-kestrel/problem/README.md).

![Your first verify: every rule fails and says what to try next](images/first-run.png)

When a command prints something you do not expect, look it up in [troubleshooting.md](troubleshooting.md).
