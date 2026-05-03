export type Position = {
  x: number;
  y: number;
  z: number;
};

export type SaveDigsite = {
  mapHash: string;
  digsiteId: string;
  dug: boolean;
  rawHd: unknown;
  scenePath?: string;
  sceneName?: string;
  levelFile?: string;
  objectName?: string;
  position?: Position;
  confidence: "catalog" | "catalog-fallback" | "scene-only" | "unknown";
  wiki?: {
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
    mappingConfidence: string;
    mappingNote?: string;
  };
  wikiCandidates: Array<{
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
  }>;
};

export type SlotSummary = {
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

export type ScanResult = {
  saveRoot: string;
  catalogEntries: number;
  wikiGuideEntries: number;
  wikiMappings: number;
  scannedAt: string;
  slots: SlotSummary[];
};
