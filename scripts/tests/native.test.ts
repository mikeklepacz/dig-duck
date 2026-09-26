import assert from "node:assert/strict";
import { test } from "node:test";
import { scanExampleSaves } from "../../src/demo";
import { scanBrowserSaveFiles } from "../../src/browser-scan";
import { scanNativeSaves, forgetNativeFolder, copyText } from "../../src/native";
import catalog from "../../src/data/digsite-catalog.json";

function saveFile(path: string, data: unknown) {
  const file = new File([JSON.stringify(data)], path.split("/").at(-1)!);
  Object.defineProperty(file, "webkitRelativePath", { value: `Saves/${path}` });
  return file;
}

function completionFixture(count: number, achievement: number, undug = false) {
  const maps = new Map<string, Array<{ st: string; id: string; hd: number }>>();
  for (const [index, site] of catalog.slice(0, count).entries()) {
    const objects = maps.get(site.mapHash) ?? [];
    objects.push({ st: "digsite", id: site.digsiteId, hd: undug && index === 0 ? 0 : 1 });
    maps.set(site.mapHash, objects);
  }
  return [saveFile("default/achievements.stuff", { "13": achievement }),
    ...[...maps].map(([hash, objects]) => saveFile(`default/map/${hash}.stuff`, { objects }))];
}

test("completed game counter does not invent a missing spot for an absent map record", async () => {
  const scan = await scanBrowserSaveFiles(completionFixture(115, 116));
  const slot = scan.slots[0];
  assert.equal(slot.dugDigsites, 116);
  assert.equal(slot.totalDigsites, 116);
  assert.equal(slot.missingDigsites, 0);
  assert.equal(slot.all.length, 115);
  assert.match(slot.progressNote!, /115 individual location records/);
  assert.equal(scan.slots[1].exists, false);
  assert.equal(scan.slots[2].exists, false);
});

test("an incomplete counter matching observed digs is not a complete-game baseline", async () => {
  const slot = (await scanBrowserSaveFiles(completionFixture(2, 2))).slots[0];
  assert.ok(slot.totalDigsites > 2);
  assert.ok(slot.missingDigsites > 0);
});

test("partial save uses game progress and labels mismatched location candidates", async () => {
  const slot = (await scanBrowserSaveFiles(completionFixture(59, 60))).slots[0];
  assert.equal(slot.dugDigsites, 60);
  assert.equal(slot.totalDigsites, 116);
  assert.equal(slot.missingDigsites, 56);
  assert.equal(slot.locationCandidates, true);
  assert.match(slot.progressNote!, /candidates, not a confirmed list/);
});

test("a complete counter does not hide explicitly undug records", async () => {
  const slot = (await scanBrowserSaveFiles(completionFixture(115, 116, true))).slots[0];
  assert.ok(slot.missingDigsites > 0);
  assert.match(slot.progressNote!, /conflicts/);
});

test("example uses fictional files and clearly labels them", async () => {
  const scan = await scanExampleSaves();
  assert.equal(scan.saveRoot, "Example saves — not your game");
  assert.equal(scan.slots[0].missingDigsites, 2);
  assert.equal(scan.slots[1].exists, false);
});

test("native bridge preserves scanner results and handles cancellation/recovery", async () => {
  const site = catalog.find((site) => !site.confidence)!;
  const path = `default/map/${site.mapHash}.stuff`;
  const text = JSON.stringify({ objects: [{ st: "digsite", id: site.digsiteId, hd: 1 }] });
  const file = new File([text], `${site.mapHash}.stuff`);
  Object.defineProperty(file, "webkitRelativePath", { value: `Saves/${path}` });
  const expected = await scanBrowserSaveFiles([file]);
  const messages: Array<Record<string, string>> = [];
  let reply: Record<string, unknown> = { files: [{ path, text, modified: 0 }], folderName: "Game Saves" };
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    webkit: { messageHandlers: { digDuck: { postMessage: async (body: Record<string, string>) => {
      messages.push(body); return reply;
    } } } }
  } });
  try {
    const actual = await scanNativeSaves("choose");
    assert.deepEqual(actual!.scan.slots, expected.slots);
    assert.equal(actual!.scan.saveRoot, "Game Saves");
    reply = { cancelled: true };
    assert.equal(await scanNativeSaves("choose"), null);
    reply = { needsFolder: true };
    assert.equal(await scanNativeSaves("restore"), null);
    reply = {};
    await assert.rejects(scanNativeSaves("rescan"), /No saves found/);
    await forgetNativeFolder();
    await copyText("Museum location");
    assert.deepEqual(messages.at(-2), { action: "forget" });
    assert.deepEqual(messages.at(-1), { action: "copy", text: "Museum location" });
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
