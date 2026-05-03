import { useEffect, useMemo, useState } from "react";
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
  void navigator.clipboard?.writeText(lines.join("\n"));
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "good" | "warn" }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
    <div className="slot-tabs" role="tablist" aria-label="Save slots">
      {slots.map((slot) => (
        <button
          key={slot.id}
          className={slot.id === selected ? "slot-tab selected" : "slot-tab"}
          onClick={() => onSelect(slot.id)}
          type="button"
        >
          <span>{slot.label}</span>
          <strong>{slot.missingDigsites}</strong>
        </button>
      ))}
    </div>
  );
}

function LocationRow({ site }: { site: SaveDigsite }) {
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
              <img src={spot.image.localPath} alt={spot.title} loading="lazy" />
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

      <button className="icon-button" type="button" onClick={() => copyLocation(site)} aria-label="Copy location">
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
        <h2>{slot.label} was not found</h2>
        <p>{slot.path}</p>
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
          <h2>{showAll ? "All Digsites" : "Missing Digsites"}</h2>
          <span>{visibleSites.length} shown</span>
        </div>
        {visibleSites.length > 0 ? (
          visibleSites.map((site) => <LocationRow key={`${site.mapHash}:${site.digsiteId}`} site={site} />)
        ) : (
          <div className="complete-state">
            <CheckCircle2 size={28} />
            <h3>No missing digsites</h3>
          </div>
        )}
      </section>
    </>
  );
}

export function App() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadScan() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scan");
      if (!response.ok) throw new Error(`Scan failed (${response.status})`);
      const nextScan = (await response.json()) as ScanResult;
      setScan(nextScan);
      if (!nextScan.slots.some((slot) => slot.id === selectedSlot)) {
        setSelectedSlot(nextScan.slots[0]?.id ?? "default");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadScan();
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

        <button className="primary-action" type="button" onClick={() => void loadScan()} disabled={loading}>
          <RefreshCcw size={17} />
          <span>{loading ? "Scanning" : "Rescan"}</span>
        </button>
      </header>

      {error ? (
        <section className="error-band">
          <CircleAlert size={20} />
          <span>{error}</span>
        </section>
      ) : null}

      {scan ? (
        <>
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
          </section>

          <SlotTabs slots={scan.slots} selected={selectedSlot} onSelect={setSelectedSlot} />
          {selected ? <SlotDetail slot={selected} /> : null}
        </>
      ) : (
        <section className="loading-state">
          <RefreshCcw size={28} />
          <h2>Scanning saves</h2>
        </section>
      )}
    </main>
  );
}
