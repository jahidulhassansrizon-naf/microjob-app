import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function isTemplateImageDirectory(name: string) {
  const value = normalize(name);
  return value.includes("aitemplateimage") || value === "aitemplates" || value === "aitemplate";
}

async function listDirectories(root: string, depth = 0): Promise<string[]> {
  if (depth > 5) return [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".next" || entry.name === "node_modules") continue;
    const fullPath = path.join(root, entry.name);
    if (isTemplateImageDirectory(entry.name)) {
      found.push(fullPath);
      // The matching directory is the source; don't scan nested folders twice.
      continue;
    }
    found.push(...await listDirectories(fullPath, depth + 1));
  }
  return found;
}

async function collectImages(folder: string, publicRoot: string, depth = 0): Promise<Array<{
  url: string;
  fileName: string;
  stem: string;
  relativePath: string;
}>> {
  if (depth > 8) return [];
  let entries;
  try {
    entries = await readdir(folder, { withFileTypes: true });
  } catch {
    return [];
  }
  const assets: Array<{ url: string; fileName: string; stem: string; relativePath: string }> = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      assets.push(...await collectImages(fullPath, publicRoot, depth + 1));
      continue;
    }
    if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const relative = path.relative(publicRoot, fullPath).split(path.sep).join("/");
    const url = "/" + relative.split("/").map((part) => encodeURIComponent(part)).join("/");
    assets.push({
      url,
      fileName: entry.name,
      stem: path.basename(entry.name, path.extname(entry.name)),
      relativePath: relative,
    });
  }
  return assets;
}

export async function GET() {
  const publicRoot = path.join(process.cwd(), "public");
  const folders = await listDirectories(publicRoot);
  const assetGroups = await Promise.all(folders.map((folder) => collectImages(folder, publicRoot)));
  const unique = new Map<string, { url: string; fileName: string; stem: string; relativePath: string }>();
  for (const asset of assetGroups.flat()) unique.set(asset.url, asset);
  const assets = [...unique.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }));
  return NextResponse.json({ assets }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
