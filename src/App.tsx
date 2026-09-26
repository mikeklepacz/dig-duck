import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
  Database,
  ExternalLink,
  FolderOpen,
  MapPinned,
  RefreshCcw,
  Search,
  Shovel
} from "lucide-react";
import type { SaveDigsite, ScanResult, SlotSummary } from "./types";
import { scanBrowserSaveFiles } from "./browser-scan";
import { copyText, forgetNativeFolder, isNativeApp, scanNativeSaves } from "./native";
import { scanExampleSaves } from "./demo";

const defaultSaveFolderPath =
  "~/Library/Containers/com.rac7.SneakySasquatchMac/Data/Library/Application Support/com.rac7.SneakySasquatchMac";

function formatDate(value: string | null) {
  if (!value) return "Not found";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function shortHash(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatPosition(site: SaveDigsite) {
  if (!site.position) return "No scene coordinates";
  return `x ${site.position.x}, y ${site.position.y}, z ${site.position.z}`;
}

function copyLocation(site: SaveDigsite) {
  const lines = [
    site.wiki ? `Wiki: ${site.wiki.title}` : undefined,
    `Scene: ${site.sceneName ?? site.scenePath ?? "Unknown scene"}`,
    `Digsite: ${site.digsiteId}`,
    `Map: ${site.mapHash}`,
    `Position: ${formatPosition(site)}`,
    site.wiki ? `Description: ${site.wiki.description}` : undefined
  ].filter(Boolean);
  return copyText(lines.join("\n"));
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "good" | "warn" }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SaveFolderHelp({ native = false }: { native?: boolean }) {
  return (
    <section className="help-panel">
      <h2>Choose the Sneaky Sasquatch save folder</h2>
      <ol>
        <li>Click <strong>{native ? "Open My Saves" : "Choose Save Folder"}</strong>.</li>
        <li>Press <strong>Command-Shift-G</strong>.</li>
        <li>Paste this path and press <strong>Return</strong>.</li>
        <li>Click <strong>{native ? "Allow Access" : "Open"}</strong>.</li>
      </ol>
      <code>{defaultSaveFolderPath}</code>
    </section>
  );
}

function SlotTabs({
  slots,
  selected,
  onSelect
}: {
  slots: SlotSummary[];
  selected: string;
  onSelect: (slot: string) => void;
}) {
  return (
    <div className="slot-tabs" role="group" aria-label="Save slots">
      {slots.map((slot) => (
        <button
          key={slot.id}
          className={slot.id === selected ? "slot-tab selected" : "slot-tab"}
          aria-pressed={slot.id === selected}
          onClick={() => onSelect(slot.id)}
          type="button"
        >
          <span>{slot.label}</span>
          <strong>{slot.exists ? slot.missingDigsites : "—"}</strong>
        </button>
      ))}
    </div>
  );
}

function LocationRow({ site }: { site: SaveDigsite }) {
  const [copyStatus, setCopyStatus] = useState("Copy location");
  const status =
    site.confidence === "unknown"
      ? "Needs catalog entry"
      : site.confidence === "scene-only"
        ? "Scene matched"
        : site.confidence === "catalog-fallback"
          ? "Position inferred"
          : "Scene matched";
  const wikiSpots = site.wiki ? [site.wiki] : site.wikiCandidates;
  const hasExactWiki = Boolean(site.wiki);

  return (
    <article className="location-row">
      <div className="location-main">
        <div className="location-icon">
          <MapPinned size={18} />
        </div>
        <div>
          <h3>{site.sceneName ?? "Unknown Scene"}</h3>
          <p>{site.scenePath ?? shortHash(site.mapHash)}</p>
        </div>
      </div>

      {wikiSpots.length > 0 ? (
        <div className={hasExactWiki ? "wiki-panel exact" : "wiki-panel candidates"}>
          {!hasExactWiki ? <span className="candidate-label">Possible guide match</span> : null}
          {wikiSpots.map((spot) => (
            <div className="wiki-match" key={spot.number}>
              <img src={spot.image.localPath.replace(/^\//, "./")} alt={spot.title} loading="lazy" />
              <div>
                <h4>{spot.title}</h4>
                <p>{spot.description}</p>
                <a href={spot.sourceUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} />
                  <span>Wiki source</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="location-meta">
        <span>{site.objectName ?? "Digsite"}</span>
        <span>ID {site.digsiteId}</span>
        <span>{formatPosition(site)}</span>
        <span>{site.wiki ? "Wiki matched" : site.wikiCandidates.length > 0 ? "Guide suggested" : status}</span>
      </div>

      <button className="icon-button" type="button" onClick={() => void copyLocation(site).then(() => setCopyStatus("Copied")).catch(() => setCopyStatus("Copy failed; try again"))} aria-label={copyStatus} title={copyStatus}>
        <Copy size={17} />
      </button>
    </article>
  );
}

function SlotDetail({ slot }: { slot: SlotSummary }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visibleSites = useMemo(() => {
    const source = showAll ? slot.all : slot.missing;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((site) =>
      [site.sceneName, site.scenePath, site.digsiteId, site.mapHash, site.objectName, site.wiki?.title, site.wiki?.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [query, showAll, slot.all, slot.missing]);

  if (!slot.exists) {
    return (
      <section className="empty-state">
        <CircleAlert size={24} />
        <h2>{slot.label} is not available locally</h2>
        <p>If this save appears in Sneaky Sasquatch, open that slot in the Mac game and let it finish loading. Then quit the game and click Rescan here.</p>
        <p>Dig Duck reads downloaded save files; a slot shown on the game's selection screen may not have downloaded yet.</p>
      </section>
    );
  }

  return (
    <>
      <section className="summary-band">
        <Stat label="Dug" value={`${slot.dugDigsites}/${slot.totalDigsites}`} tone={slot.missingDigsites === 0 ? "good" : "neutral"} />
        <Stat label="Missing" value={slot.missingDigsites} tone={slot.missingDigsites === 0 ? "good" : "warn"} />
        <Stat label="Achievement" value={slot.achievementDigCount ?? "Unknown"} />
        <Stat label="Game Day" value={slot.day ?? "Unknown"} />
      </section>

      {slot.progressNote ? <p className="help-panel">{slot.progressNote}</p> : null}
      <section className="toolbar" aria-label="Location filters">
        <label className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scene, ID, map" />
        </label>
        <div className="segmented">
          <button className={!showAll ? "selected" : ""} type="button" onClick={() => setShowAll(false)}>
            Missing
          </button>
          <button className={showAll ? "selected" : ""} type="button" onClick={() => setShowAll(true)}>
            All
          </button>
        </div>
      </section>

      <section className="locations" aria-label="Dig locations">
        <div className="section-title">
          <h2>{showAll ? "All Digsites" : slot.locationCandidates ? "Possible Missing Locations" : "Missing Digsites"}</h2>
          <span>{visibleSites.length} shown</span>
        </div>
        {visibleSites.length > 0 ? (
          visibleSites.map((site) => <LocationRow key={`${site.mapHash}:${site.digsiteId}`} site={site} />)
        ) : (
          <div className="complete-state">
            <CheckCircle2 size={28} />
            <h3>{query ? "No locations match your search" : showAll ? "No digsites found" : "No missing digsites"}</h3>
          </div>
        )}
      </section>
    </>
  );
}

export function App() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [example, setExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const native = isNativeApp();

  async function loadNative(action: "choose" | "restore" | "rescan") {
    setLoading(true);
    setError(null);
    try {
      const result = await scanNativeSaves(action);
      if (result) {
        setExample(false);
        setScan(result.scan);
        setSelectedSlot((current) => result.scan.slots.find((slot) => slot.id === current && slot.exists)?.id
          ?? result.scan.slots.find((slot) => slot.exists)?.id ?? "default");
        setError(result.warning ?? null);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }

  function chooseFolder() {
    if (native) void loadNative("choose");
    else fileInputRef.current?.click();
  }

  async function forgetFolder() {
    try {
      await forgetNativeFolder();
      setScan(null);
      setExample(false);
      setError(null);
    } catch {
      setError("Could not forget this folder. Please try again.");
    }
  }

  async function showExample() {
    setLoading(true);
    setError(null);
    try {
      setScan(await scanExampleSaves());
      setSelectedSlot("default");
      setExample(true);
    } catch {
      setError("Could not open the example. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadScan() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scan");
      if (!response.ok) throw new Error(`Scan failed (${response.status})`);
      const nextScan = (await response.json()) as ScanResult;
      setExample(false);
      setScan(nextScan);
      setServerAvailable(true);
      if (!nextScan.slots.some((slot) => slot.id === selectedSlot)) {
        setSelectedSlot(nextScan.slots[0]?.id ?? "default");
      }
    } catch (nextError) {
      setServerAvailable(false);
      if (scan) {
        setError(nextError instanceof Error ? nextError.message : "Scan failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const nextScan = await scanBrowserSaveFiles(files);
      if (!nextScan.slots.some((slot) => slot.exists)) throw new Error("No digsite saves found. Choose the folder containing default, default2, or default3.");
      setExample(false);
      setScan(nextScan);
      if (!nextScan.slots.some((slot) => slot.id === selectedSlot)) {
        setSelectedSlot(nextScan.slots[0]?.id ?? "default");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not read that save folder");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (native) {
      void loadNative("restore");
    } else if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      void loadScan();
    }
  }, []);

  const selected = scan?.slots.find((slot) => slot.id === selectedSlot) ?? scan?.slots[0] ?? null;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <Shovel size={22} />
          </div>
          <div>
            <h1>Dig Duck</h1>
            <p>Read-only Sneaky Sasquatch digsite scanner</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          className="file-picker"
          type="file"
          multiple
          {...{ webkitdirectory: "" }}
          onChange={(event) => void loadSelectedFiles(event.currentTarget.files)}
        />
        <button className="primary-action" type="button" onClick={chooseFolder} disabled={loading}>
          <FolderOpen size={17} />
          <span>{loading ? "Scanning" : native ? "Open My Saves" : scan ? "Choose Different Folder" : "Choose Save Folder"}</span>
        </button>
      </header>

      {error ? (
        <section className="error-band" role="alert">
          <CircleAlert size={20} />
          <span>{error}</span>
        </section>
      ) : null}

      {scan ? (
        <>
          {example ? <section className="help-panel" role="status"><strong>Example saves</strong><p>These are fictional results to show how Dig Duck works. Open your saves to see your own missing spots.</p></section> : null}
          <section className="source-strip">
            <div>
              <FolderOpen size={18} />
              <span>{scan.saveRoot}</span>
            </div>
            <div>
              <Database size={18} />
              <span>{scan.catalogEntries} save entries</span>
            </div>
            <div>
              <MapPinned size={18} />
              <span>{scan.wikiGuideEntries} wiki guide spots</span>
            </div>
            <div>
              <ChevronRight size={18} />
              <span>{formatDate(scan.scannedAt)}</span>
            </div>
            {!example && (serverAvailable || native) ? (
              <button className="strip-button" type="button" onClick={() => native ? void loadNative("rescan") : void loadScan()} disabled={loading}>
                <RefreshCcw size={16} />
                <span>Rescan</span>
              </button>
            ) : null}
            {native && !example ? <button className="strip-button" type="button" onClick={() => void forgetFolder()} disabled={loading}>Forget Folder</button> : null}
          </section>

          <SlotTabs slots={scan.slots} selected={selectedSlot} onSelect={setSelectedSlot} />
          {selected ? <SlotDetail slot={selected} /> : null}
        </>
      ) : (
        <>
          {!native ? <SaveFolderHelp /> : null}
          <section className="loading-state start-state">
            <FolderOpen size={30} />
            <h2>{loading ? "Reading your saves…" : "Find those last missing dig spots"}</h2>
            <p>{native
              ? "Play Sneaky Sasquatch on this Mac, then quit the game. Click Open My Saves. We’ll open the standard save location in a macOS permission window—click Allow Access to read your progress. We’ll remember access for next time."
              : "Choose your Sneaky Sasquatch save folder to get started."}</p>
            <p>Your saves stay on your Mac. Dig Duck never changes or uploads them.</p>
            <button className="primary-action" type="button" onClick={chooseFolder} disabled={loading}>
              <FolderOpen size={17} />
              <span>{loading ? "Scanning" : native ? "Open My Saves" : "Choose Save Folder"}</span>
            </button>
            <button className="strip-button" type="button" onClick={() => void showExample()} disabled={loading}>Preview with example saves</button>
          </section>
          {native ? <details className="help-panel"><summary>No saves showing up?</summary>
            <p>Dig Duck needs saves from the Mac version of Sneaky Sasquatch. If you play on iPhone or iPad, open the Mac game with the same Apple Account and let your save sync first.</p>
            <p>If macOS opens a different location, the save folder may not exist yet. Open the Mac game and load your save first, then try Open My Saves again. For a backup in another location, you can navigate there in the permission window.</p>
            <SaveFolderHelp native />
          </details> : null}
        </>
      )}
      <footer className="app-footer">
        <p>Unofficial community tool. Not affiliated with RAC7 or Apple. Suggested guide matches may need confirmation.</p>
        <a href="https://github.com/mikeklepacz/dig-duck/issues" target="_blank" rel="noreferrer">Help & feedback</a>
        <details><summary>Privacy & credits</summary>
          <p>Dig Duck reads only the save folder you select. No accounts, analytics, advertising, or save uploads. Forget Folder removes the saved permission bookmark. Opening a guide or support link takes you to an external website with its own privacy policy.</p>
          <p>Guide descriptions and images originate from the <a href="https://sneaky-sasquatch.fandom.com/wiki/Dig_Spot" target="_blank" rel="noreferrer">Sneaky Sasquatch Wiki</a>. Game content belongs to its respective owners.</p>
        </details>
      </footer>
    </main>
  );
}
