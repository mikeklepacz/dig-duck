import express from "express";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

type CatalogEntry = {
  mapHash: string;
  digsiteId: string;
  scenePath: string;
  sceneName: string;
  levelFile: string;
  objectName: string;
  position?: { x: number; y: number; z: number };
  confidence?: string;
};

type WikiSpot = {
  number: number;
  title: string;
  area: string;
  description: string;
  image: {
    fileName: string;
    localPath: string;
    sourceUrl: string;
  };
  sourceUrl: string;
};

type WikiMapping = {
  mapHash: string;
  digsiteId: string;
  wikiNumber: number;
  confidence: string;
  note?: string;
};

type SaveDigsite = {
  mapHash: string;
  digsiteId: string;
  dug: boolean;
  rawHd: unknown;
  scenePath?: string;
  sceneName?: string;
  levelFile?: string;
  objectName?: string;
  position?: { x: number; y: number; z: number };
  confidence: "catalog" | "catalog-fallback" | "scene-only" | "unknown";
  wiki?: WikiSpot & {
    mappingConfidence: string;
    mappingNote?: string;
  };
  wikiCandidates: WikiSpot[];
};

type SlotSummary = {
  id: string;
  label: string;
  path: string;
  exists: boolean;
  totalDigsites: number;
  dugDigsites: number;
  missingDigsites: number;
  achievementDigCount: number | null;
  lastModified: string | null;
  currentMap: string | null;
  day: number | null;
  missing: SaveDigsite[];
  all: SaveDigsite[];
};

type SlotDigsiteState = {
  dug: boolean;
  rawHd: unknown;
};

type SlotFiles = {
  achievements: Record<string, unknown> | null;
  sasquatch: Record<string, unknown> | null;
};

const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4174);
const appRoot = process.env.DIG_DUCK_APP_ROOT ?? process.cwd();
const distRoot = path.join(appRoot, "dist");
const saveRoot =
  process.env.SASQUATCH_SAVE_DIR ??
  path.join(
    os.homedir(),
    "Library",
    "Containers",
    "com.rac7.SneakySasquatchMac",
    "Data",
    "Library",
    "Application Support",
    "com.rac7.SneakySasquatchMac"
  );

const slotLabels: Record<string, string> = {
  default: "Save 1",
  default2: "Save 2",
  default3: "Save 3"
};

function catalogKey(mapHash: string, digsiteId: string) {
  return `${mapHash}:${digsiteId}`;
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

async function getCatalog() {
  const filePath = path.resolve(appRoot, "src/data/digsite-catalog.json");
  const entries = (await readJson<CatalogEntry[]>(filePath)) ?? [];
  return new Map(entries.map((entry) => [catalogKey(entry.mapHash, entry.digsiteId), entry]));
}

async function getWikiGuide() {
  const [spots, mappings] = await Promise.all([
    readJson<WikiSpot[]>(path.resolve(appRoot, "src/data/wiki-dig-spots.json")),
    readJson<WikiMapping[]>(path.resolve(appRoot, "src/data/wiki-mapping.json"))
  ]);
  const spotByNumber = new Map((spots ?? []).map((spot) => [spot.number, spot]));
  const mappingBySaveId = new Map(
    (mappings ?? []).map((mapping) => [catalogKey(mapping.mapHash, mapping.digsiteId), mapping])
  );
  return {
    spotCount: spotByNumber.size,
    mappingCount: mappingBySaveId.size,
    mappingBySaveId,
    spotByNumber,
    spots: spots ?? []
  };
}

const tokenAliases: Record<string, string[]> = {
  campground: ["campground"],
  golfcourse: ["golf", "course"],
  racetrack: ["race", "track"],
  stripmall: ["strip", "mall"],
  dirtpark: ["dirt", "racetrack"],
  seaport: ["port"],
  snowball: ["snowball", "fights", "arena"],
  lakeunderwater: ["lake", "underwater"],
  riverhighway: ["river", "highway"],
  lakemaze: ["lake", "maze"]
};

const weakTokens = new Set([
  "area",
  "behind",
  "cave",
  "corner",
  "dig",
  "east",
  "eastern",
  "entrance",
  "forest",
  "left",
  "level",
  "lower",
  "main",
  "near",
  "north",
  "northern",
  "road",
  "shore",
  "side",
  "south",
  "southern",
  "the",
  "track",
  "underwater",
  "west",
  "western"
]);

const sceneOverridesByMapHash: Record<string, { sceneName: string; scenePath: string }> = {
  "65f4f6542ff0f4de590b580416ff3543": {
    sceneName: "Island_Underwater",
    scenePath: "Assets/Scenes/Island/Island_Underwater.unity"
  },
  "c13101f490be3a64ab08f57029d5095b": {
    sceneName: "Ocean Rocky_Underwater",
    scenePath: "Assets/Scenes/Ocean/Ocean Rocky_Underwater.unity"
  },
  f689e641b5ec7470d923eae12eedd349: {
    sceneName: "GolfCourse_Long Drive_Underwater",
    scenePath: "Assets/Scenes/Golf Course/GolfCourse_Long Drive_Underwater.unity"
  },
  ad4954439bb3254459b989ed1663e8a9: {
    sceneName: "Marina_River_Underwater",
    scenePath: "Assets/Scenes/Town/Marina_River_Underwater.unity"
  }
};

function tokenize(value: string) {
  const spaced = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_()/.-]/g, " ")
    .toLowerCase();
  const rawTokens = spaced.split(/\s+/).filter(Boolean);
  return rawTokens.flatMap((token) => tokenAliases[token] ?? [token]);
}

function wikiCandidateScore(site: SaveDigsite, spot: WikiSpot) {
  const sceneTokens = new Set(tokenize(`${site.sceneName ?? ""} ${site.scenePath ?? ""}`));
  const areaTokens = [...new Set(tokenize(`${spot.area} ${spot.description.split(".")[0]}`))];
  const strongAreaTokens = areaTokens.filter((token) => !weakTokens.has(token));
  const strongMatches = strongAreaTokens.filter((token) => sceneTokens.has(token)).length;
  const allMatches = areaTokens.filter((token) => sceneTokens.has(token)).length;

  if (strongMatches === 0) return 0;
  let score = strongMatches * 4 + allMatches;
  const sceneText = [...sceneTokens].join(" ");
  const areaText = tokenize(spot.area).join(" ");
  if (sceneText.includes(areaText) || areaText.includes(sceneText)) score += 6;
  if (sceneTokens.has("underwater") === spot.area.toLowerCase().includes("underwater")) score += 3;
  return score;
}

function findWikiCandidates(site: SaveDigsite, spots: WikiSpot[]) {
  if (site.wiki) return [];
  const scored = spots
    .map((spot) => ({ spot, score: wikiCandidateScore(site, spot) }))
    .filter((candidate) => candidate.score >= 5)
    .sort((a, b) => b.score - a.score || a.spot.number - b.spot.number);
  const bestScore = scored[0]?.score ?? 0;
  const equallyLikely = scored.filter((candidate) => candidate.score === bestScore);
  const candidates = equallyLikely.length > 3 && equallyLikely.length <= 6 ? equallyLikely : scored.slice(0, 3);
  return candidates
    .map((candidate) => candidate.spot);
}

async function latestMtime(dirPath: string) {
  let latest = 0;
  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const next = path.join(current, entry.name);
        const info = await stat(next);
        latest = Math.max(latest, info.mtimeMs);
        if (entry.isDirectory()) {
          await walk(next);
        }
      })
    );
  }
  try {
    await walk(dirPath);
  } catch {
    return null;
  }
  return latest ? new Date(latest).toISOString() : null;
}

function normalizeSceneName(sceneName?: string) {
  if (!sceneName) return undefined;
  return sceneName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getSlotDigsites(slotId: string) {
  const slotPath = path.join(saveRoot, slotId);
  const mapPath = path.join(slotPath, "map");
  const digsites = new Map<string, SlotDigsiteState>();

  if (existsSync(slotPath) && existsSync(mapPath)) {
    const files = await readdir(mapPath);
    await Promise.all(
      files
        .filter((file) => file.endsWith(".stuff"))
        .map(async (file) => {
          const mapHash = file.replace(/\.stuff$/, "");
          const data = await readJson<{ objects?: Array<Record<string, unknown>> }>(
            path.join(mapPath, file)
          );
          for (const object of data?.objects ?? []) {
            if (object.st !== "digsite" || typeof object.id !== "string") continue;
            digsites.set(catalogKey(mapHash, object.id), {
              dug: object.hd === 1,
              rawHd: object.hd
            });
          }
        })
    );
  }

  return digsites;
}

async function getSlotFiles(slotId: string): Promise<SlotFiles> {
  const slotPath = path.join(saveRoot, slotId);
  const [achievements, sasquatch] = await Promise.all([
    readJson<Record<string, unknown>>(path.join(slotPath, "achievements.stuff")),
    readJson<Record<string, unknown>>(path.join(slotPath, "sasquatch.stuff"))
  ]);
  return { achievements, sasquatch };
}

function buildSite(
  key: string,
  state: SlotDigsiteState | undefined,
  catalog: Map<string, CatalogEntry>,
  wikiGuide: Awaited<ReturnType<typeof getWikiGuide>>
) {
  const [mapHash, digsiteId] = key.split(":");
  const entry = catalog.get(key);
  const sceneOverride = sceneOverridesByMapHash[mapHash];
  const confidence = entry?.confidence === "scene-only" ? "scene-only" : entry?.confidence ? "catalog-fallback" : entry ? "catalog" : "unknown";
  const wikiMapping = wikiGuide.mappingBySaveId.get(key);
  const wikiSpot = wikiMapping ? wikiGuide.spotByNumber.get(wikiMapping.wikiNumber) : undefined;
  const site: SaveDigsite = {
    mapHash,
    digsiteId,
    dug: state?.dug ?? false,
    rawHd: state?.rawHd ?? null,
    scenePath: entry?.scenePath || sceneOverride?.scenePath,
    sceneName: normalizeSceneName(entry?.scenePath ? entry.sceneName : sceneOverride?.sceneName ?? entry?.sceneName),
    levelFile: entry?.levelFile,
    objectName: entry?.objectName,
    position: entry?.position,
    confidence,
    wiki:
      wikiMapping && wikiSpot
        ? {
            ...wikiSpot,
            mappingConfidence: wikiMapping.confidence,
            mappingNote: wikiMapping.note
          }
        : undefined,
    wikiCandidates: []
  };
  site.wikiCandidates = findWikiCandidates(site, wikiGuide.spots);
  return site;
}

async function scanSlot(
  slotId: string,
  baselineKeys: string[],
  slotDigsites: Map<string, SlotDigsiteState>,
  slotFiles: SlotFiles,
  catalog: Map<string, CatalogEntry>,
  wikiGuide: Awaited<ReturnType<typeof getWikiGuide>>
): Promise<SlotSummary> {
  const slotPath = path.join(saveRoot, slotId);
  const exists = existsSync(slotPath);
  const all = baselineKeys.map((key) => buildSite(key, slotDigsites.get(key), catalog, wikiGuide));

  all.sort((a, b) => {
    const scene = (a.sceneName ?? a.mapHash).localeCompare(b.sceneName ?? b.mapHash);
    return scene || a.digsiteId.localeCompare(b.digsiteId);
  });

  const { achievements, sasquatch } = slotFiles;
  const missing = all.filter((site) => !site.dug);

  return {
    id: slotId,
    label: slotLabels[slotId] ?? slotId,
    path: slotPath,
    exists,
    totalDigsites: all.length,
    dugDigsites: all.filter((site) => site.dug).length,
    missingDigsites: missing.length,
    achievementDigCount: typeof achievements?.["13"] === "number" ? achievements["13"] : null,
    lastModified: exists ? await latestMtime(slotPath) : null,
    currentMap: typeof sasquatch?.current_map === "string" ? sasquatch.current_map : null,
    day: typeof sasquatch?.day === "number" ? sasquatch.day : null,
    missing,
    all
  };
}

app.get("/api/scan", async (_request, response) => {
  try {
    const [catalog, wikiGuide] = await Promise.all([getCatalog(), getWikiGuide()]);
    const slotIds = ["default", "default2", "default3"];
    const [slotDigsiteEntries, slotFileEntries] = await Promise.all([
      Promise.all(slotIds.map(async (slotId) => [slotId, await getSlotDigsites(slotId)] as const)),
      Promise.all(slotIds.map(async (slotId) => [slotId, await getSlotFiles(slotId)] as const))
    ]);
    const slotDigsites = new Map(slotDigsiteEntries);
    const slotFiles = new Map(slotFileEntries);
    const completedSlot = slotIds.find((slotId) => {
      const digsites = slotDigsites.get(slotId) ?? new Map();
      const achievementCount = slotFiles.get(slotId)?.achievements?.["13"];
      const dugCount = [...digsites.values()].filter((site) => site.dug).length;
      return typeof achievementCount === "number" && achievementCount > 0 && achievementCount === dugCount;
    });
    const observedKeys = new Set([...slotDigsites.values()].flatMap((digsites) => [...digsites.keys()]));
    const baselineKeys = completedSlot
      ? [...(slotDigsites.get(completedSlot) ?? new Map()).keys()]
      : [...catalog.entries()]
          .filter(([, entry]) => entry.confidence !== "scene-only" || observedKeys.has(catalogKey(entry.mapHash, entry.digsiteId)))
          .map(([key]) => key);
    const slots = await Promise.all(
      slotIds.map((slot) =>
        scanSlot(
          slot,
          baselineKeys,
          slotDigsites.get(slot) ?? new Map(),
          slotFiles.get(slot) ?? { achievements: null, sasquatch: null },
          catalog,
          wikiGuide
        )
      )
    );
    response.json({
      saveRoot,
      catalogEntries: catalog.size,
      wikiGuideEntries: wikiGuide.spotCount,
      wikiMappings: wikiGuide.mappingCount,
      scannedAt: new Date().toISOString(),
      slots
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unable to scan save files"
    });
  }
});

if (existsSync(distRoot)) {
  app.use(express.static(distRoot));
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(distRoot, "index.html"));
  });
}

app.listen(port, "127.0.0.1", () => {
  console.log(`Dig Duck API listening on http://127.0.0.1:${port}`);
});
