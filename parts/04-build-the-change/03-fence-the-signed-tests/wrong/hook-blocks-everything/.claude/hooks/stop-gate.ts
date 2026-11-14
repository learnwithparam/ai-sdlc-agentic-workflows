// Stop hook. Claude may not stop while bun test is red.
// Exit 2 sends our message back to Claude, so it keeps working. Exit 0 lets it stop.
const payload = JSON.parse(await Bun.stdin.text());
// Claude sets this when the hook already blocked once, so a stuck test cannot loop forever.
if (payload.stop_hook_active) process.exit(0);
const run = Bun.spawnSync(["bun", "test"], { stdout: "pipe", stderr: "pipe" });
if (run.exitCode === 0) process.exit(0);
const output = run.stderr.toString() + run.stdout.toString();
const lastLines = output.split("\n").slice(-15);
const tail = lastLines.join("\n");
console.error(`Blocked: bun test is red. Fix it before you stop.\n${tail}`);
process.exit(2);
