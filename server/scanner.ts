import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { ManifestEntry } from "../shared/types.ts";

export type HashCache = Map<
  string,
  { size: number; mtimeMs: number; hash: string }
>;

export async function hashFile(
  path: string,
  cache?: HashCache,
): Promise<ManifestEntry | null> {
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(path);
  } catch {
    return null;
  }
  if (!info.isFile()) return null;

  const cached = cache?.get(path);
  if (cached && cached.size === info.size && cached.mtimeMs === info.mtimeMs) {
    return { path, hash: cached.hash, size: info.size };
  }

  const bytes = await Bun.file(path).bytes();
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(bytes);
  const hash = hasher.digest("hex");
  cache?.set(path, { size: info.size, mtimeMs: info.mtimeMs, hash });
  return { path, hash, size: info.size };
}

export async function scanPaths(
  paths: string[],
  cache?: HashCache,
): Promise<ManifestEntry[]> {
  const entries: ManifestEntry[] = [];
  for (const p of paths) {
    const e = await hashFile(p, cache);
    if (e) entries.push(e);
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return entries;
}

export async function scanDirectory(
  dir: string,
  cache?: HashCache,
): Promise<ManifestEntry[]> {
  const names = await readdir(dir);
  return scanPaths(
    names.map((n) => join(dir, n)),
    cache,
  );
}
