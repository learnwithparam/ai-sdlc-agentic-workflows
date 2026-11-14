// PreToolUse hook. Claude Code sends the tool call as JSON on stdin.
// Exit 2 blocks the edit and shows our message to Claude. Exit 0 lets it through.
const payload = JSON.parse(await Bun.stdin.text());
const path: string = payload.tool_input?.file_path ?? "";
const signed = /(^|\/)test\/acceptance\//.test(path);
if (signed) {
  console.error("Blocked: test/acceptance/ is signed by qa. Change the code, not the test.");
  process.exit(2);
}
process.exit(0);
