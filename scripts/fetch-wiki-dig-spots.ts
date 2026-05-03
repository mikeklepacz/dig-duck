import * as cheerio from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

const wikiPageUrl = "https://sneaky-sasquatch.fandom.com/wiki/Dig_Spot";
const apiUrl = "https://sneaky-sasquatch.fandom.com/api.php";
const imageDir = path.resolve(process.cwd(), "public/wiki-images");
const dataPath = path.resolve(process.cwd(), "src/data/wiki-dig-spots.json");

function cleanText(value: string) {
  return value
    .replace(/\[\s*edit\s*\]/gi, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function normalizeImageUrl(url: string) {
  const [base, query = ""] = url.split("?");
  const revisionIndex = base.indexOf("/revision/");
  const normalizedBase = revisionIndex > -1 ? base.slice(0, revisionIndex) : base;
  return query ? `${normalizedBase}?${query}` : normalizedBase;
}

function imageExtension(url: string) {
  const withoutQuery = url.split("?")[0];
  const match = withoutQuery.match(/\.(png|jpe?g|webp)$/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function fetchParseHtml() {
  const params = new URLSearchParams({
    action: "parse",
    page: "Dig Spot",
    prop: "text",
    format: "json",
    formatversion: "2"
  });
  const response = await fetch(`${apiUrl}?${params}`, {
    headers: { "User-Agent": "DigDuck local catalog builder" }
  });
  if (!response.ok) {
    throw new Error(`Fandom API returned ${response.status}`);
  }
  const body = (await response.json()) as { parse?: { text?: string } };
  if (!body.parse?.text) {
    throw new Error("Fandom API response did not include parse.text");
  }
  return body.parse.text;
}

async function downloadImage(url: string, fileName: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "DigDuck local catalog builder" }
  });
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}): ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(path.join(imageDir, fileName), bytes);
}

async function main() {
  await mkdir(imageDir, { recursive: true });
  const html = await fetchParseHtml();
  const $ = cheerio.load(html);
  const spots: WikiSpot[] = [];

  $(".mw-parser-output h3").each((_index, element) => {
    const heading = cleanText($(element).text());
    const match = heading.match(/^Dig\s+(\d+)\s+-\s+(.+)$/);
    if (!match) return;

    const number = Number(match[1]);
    const area = cleanText(match[2]);
    const fragments: string[] = [];
    const images: string[] = [];

    let node = $(element).next();
    while (node.length > 0 && !["h2", "h3"].includes(node.prop("tagName")?.toLowerCase() ?? "")) {
      node.find("img").each((_imageIndex, image) => {
        const src = $(image).attr("data-src") ?? $(image).attr("src");
        if (src?.includes("static.wikia.nocookie.net")) {
          images.push(normalizeImageUrl(src));
        }
      });

      const textNode = node.clone();
      textNode.find("img, noscript, figure").remove();
      const text = cleanText(textNode.text());
      if (text && text !== "The dig spot") {
        fragments.push(text);
      }
      node = node.next();
    }

    const sourceImage = unique(images)[0];
    if (!sourceImage) {
      throw new Error(`Dig ${number} has no image`);
    }

    const fileName = `dig-${String(number).padStart(3, "0")}.${imageExtension(sourceImage)}`;
    spots.push({
      number,
      title: `Dig ${number} - ${area}`,
      area,
      description: cleanText(fragments.join(" ")),
      image: {
        fileName,
        localPath: `/wiki-images/${fileName}`,
        sourceUrl: sourceImage
      },
      sourceUrl: `${wikiPageUrl}#Dig_${number}_-_${encodeURIComponent(area.replace(/\s+/g, "_"))}`
    });
  });

  if (spots.length !== 116) {
    throw new Error(`Expected 116 dig spots, found ${spots.length}`);
  }

  await Promise.all(spots.map((spot) => downloadImage(spot.image.sourceUrl, spot.image.fileName)));
  await writeFile(dataPath, `${JSON.stringify(spots, null, 2)}\n`);
  console.log(`Wrote ${spots.length} wiki dig spots to ${dataPath}`);
  console.log(`Downloaded ${spots.length} images to ${imageDir}`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
