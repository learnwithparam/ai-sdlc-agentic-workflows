// The world contract: the begin state breaks it, and the finished chain meets it.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { kestrelFolderFor } from "../checks/lib/snapshot";
import { queueIsDueFirst, withWorld, wrenchLeavesTheFeed } from "../checks/lib/world";
import { ROOT } from "../scripts/structure";

const askTheWorld = (folder: string) =>
  withWorld(folder, async (world) => ({
    dueFirst: await queueIsDueFirst(world.url, "North"),
    leaves: await wrenchLeavesTheFeed(world.url, "B-2207"),
  }));

test("the finished chain meets the world contract", async () => {
  const answer = await askTheWorld(kestrelFolderFor(join(ROOT, "world", "finished")));
  expect(answer).toEqual({ dueFirst: true, leaves: true });
}, 30_000);

test("the begin state has the queue in the wrong order", async () => {
  const world = await import("../checks/lib/world");
  const answer = await world.withWorld(join(ROOT, "world", "kestrel"), (running) =>
    world.queueIsDueFirst(running.url, "North"),
  );
  expect(answer).toBe(false);
}, 30_000);
