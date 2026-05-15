import catalogEntries from "./data/digsite-catalog.json";
import wikiMappings from "./data/wiki-mapping.json";
import wikiSpots from "./data/wiki-dig-spots.json";
import type { SaveDigsite, ScanResult } from "./types";

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

type WikiSpot = (typeof wikiSpots)[number];
type WikiMapping = (typeof wikiMappings)[number];

type SlotDigsiteState = {
  dug: boolean;
  rawHd: unknown;
};

type SlotFiles = {
  achievements: Record<string, unknown> | null;
  sasquatch: Record<string, unknown> | null;
};

const slotIds = ["default", "default2", "default3"];
const slotLabels: Record<string, string> = {
  default: "Save 1",
  default2: "Save 2",
  default3: "Save 3"
};

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

function catalogKey(mapHash: string, digsiteId: string) {
  return `${mapHash}:${digsiteId}`;
}

function normalizeSceneName(sceneName?: string) {
  if (!sceneName) return undefined;
  return sceneName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

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
  return candidates.map((candidate) => candidate.spot);
}

function getRelativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
}

function getSlotId(file: File) {
  const parts = getRelativePath(file).split("/");
  return parts.find((part) => slotIds.includes(part));
}

async function readJsonFile(file: File) {
  try {
    return JSON.parse(await file.text()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildSite(
  key: string,
  state: SlotDigsiteState | undefined,
  catalog: Map<string, CatalogEntry>,
  mappingBySaveId: Map<string, WikiMapping>,
  spotByNumber: Map<number, WikiSpot>
) {
  const [mapHash, digsiteId] = key.split(":");
  const entry = catalog.get(key);
  const sceneOverride = sceneOverridesByMapHash[mapHash];
  const confidence = entry?.confidence === "scene-only" ? "scene-only" : entry?.confidence ? "catalog-fallback" : entry ? "catalog" : "unknown";
  const wikiMapping = mappingBySaveId.get(key);
  const wikiSpot = wikiMapping ? spotByNumber.get(wikiMapping.wikiNumber) : undefined;
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
  site.wikiCandidates = findWikiCandidates(site, wikiSpots);
  return site;
}

export async function scanBrowserSaveFiles(files: FileList | File[]): Promise<ScanResult> {
  const fileArray = [...files];
  const catalog = new Map((catalogEntries as CatalogEntry[]).map((entry) => [catalogKey(entry.mapHash, entry.digsiteId), entry]));
  const mappingBySaveId = new Map((wikiMappings as WikiMapping[]).map((mapping) => [catalogKey(mapping.mapHash, mapping.digsiteId), mapping]));
  const spotByNumber = new Map(wikiSpots.map((spot) => [spot.number, spot]));
  const slotDigsites = new Map(slotIds.map((slotId) => [slotId, new Map<string, SlotDigsiteState>()]));
  const slotFiles = new Map(slotIds.map((slotId) => [slotId, { achievements: null, sasquatch: null } as SlotFiles]));

  await Promise.all(
    fileArray.map(async (file) => {
      const relativePath = getRelativePath(file);
      const slotId = getSlotId(file);
      if (!slotId) return;

      if (relativePath.includes(`/${slotId}/map/`) && file.name.endsWith(".stuff")) {
        const mapHash = file.name.replace(/\.stuff$/, "");
        const data = await readJsonFile(file);
        const objects = Array.isArray(data?.objects) ? data.objects : [];
        for (const object of objects) {
          if (
            object &&
            typeof object === "object" &&
            "st" in object &&
            object.st === "digsite" &&
            "id" in object &&
            typeof object.id === "string"
          ) {
            slotDigsites.get(slotId)?.set(catalogKey(mapHash, object.id), {
              dug: object.hd === 1,
              rawHd: object.hd
            });
          }
        }
      }

      if (file.name === "achievements.stuff") {
        slotFiles.get(slotId)!.achievements = await readJsonFile(file);
      }
      if (file.name === "sasquatch.stuff") {
        slotFiles.get(slotId)!.sasquatch = await readJsonFile(file);
      }
    })
  );

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

  return {
    saveRoot: "Selected save folder",
    catalogEntries: catalog.size,
    wikiGuideEntries: wikiSpots.length,
    wikiMappings: wikiMappings.length,
    scannedAt: new Date().toISOString(),
    slots: slotIds.map((slotId) => {
      const all = baselineKeys
        .map((key) => buildSite(key, slotDigsites.get(slotId)?.get(key), catalog, mappingBySaveId, spotByNumber))
        .sort((a, b) => {
          const scene = (a.sceneName ?? a.mapHash).localeCompare(b.sceneName ?? b.mapHash);
          return scene || a.digsiteId.localeCompare(b.digsiteId);
        });
      const missing = all.filter((site) => !site.dug);
      const slotInfo = slotFiles.get(slotId)!;
      return {
        id: slotId,
        label: slotLabels[slotId] ?? slotId,
        path: slotId,
        exists: (slotDigsites.get(slotId)?.size ?? 0) > 0,
        totalDigsites: all.length,
        dugDigsites: all.filter((site) => site.dug).length,
        missingDigsites: missing.length,
        achievementDigCount: typeof slotInfo.achievements?.["13"] === "number" ? slotInfo.achievements["13"] : null,
        lastModified: null,
        currentMap: typeof slotInfo.sasquatch?.current_map === "string" ? slotInfo.sasquatch.current_map : null,
        day: typeof slotInfo.sasquatch?.day === "number" ? slotInfo.sasquatch.day : null,
        missing,
        all
      };
    })
  };
}
