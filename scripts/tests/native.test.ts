import assert from "node:assert/strict";
import { test } from "node:test";
import { scanExampleSaves } from "../../src/demo";
import { scanBrowserSaveFiles } from "../../src/browser-scan";
import { scanNativeSaves, forgetNativeFolder, copyText } from "../../src/native";
import catalog from "../../src/data/digsite-catalog.json";

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
