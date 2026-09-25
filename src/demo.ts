import catalog from "./data/digsite-catalog.json";
import { scanBrowserSaveFiles } from "./browser-scan";

// Fictional saves built from the bundled location catalog, never player data.
export async function scanExampleSaves() {
  const maps = new Map<string, Array<{ st: string; id: string; hd: number }>>();
  const sites = catalog.filter((site) => site.confidence !== "scene-only");
  for (const [index, site] of sites.entries()) {
    const objects = maps.get(site.mapHash) ?? [];
    objects.push({ st: "digsite", id: site.digsiteId, hd: index < 2 ? 0 : 1 });
    maps.set(site.mapHash, objects);
  }
  const files = [...maps].map(([map, objects]) => {
    const file = new File([JSON.stringify({ objects })], `${map}.stuff`);
    Object.defineProperty(file, "webkitRelativePath", { value: `Example/default/map/${map}.stuff` });
    return file;
  });
  const result = await scanBrowserSaveFiles(files);
  result.saveRoot = "Example saves — not your game";
  return result;
}
