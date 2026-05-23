import { readdir, readlink, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FileActivity } from "../shared/proc-types.ts";

const FD_SCAN_CAP = 256;
const SKIP_PREFIXES = ["/dev/", "/proc/", "/sys/", "/run/"];

function isTrackedFile(target: string): boolean {
  if (!target.startsWith("/")) return false;
  if (target === "/") return false;
  if (target.includes(":[")) return false;
  return !SKIP_PREFIXES.some((prefix) => target.startsWith(prefix));
}

function directionFromFlags(flags: number): "read" | "write" {
  return (flags & 3) === 0 ? "read" : "write";
}

type FdInfo = { pos: number; flags: number };

function parseFdInfo(text: string): FdInfo {
  let pos = 0;
  let flags = 0;
  for (const line of text.split("\n")) {
    if (line.startsWith("pos:")) pos = Number(line.slice(4).trim());
    else if (line.startsWith("flags:")) flags = parseInt(line.slice(6).trim(), 8);
  }
  return { pos, flags };
}

export class FileActivitySampler {
  private prevPos = new Map<string, number>();

  async sample(
    pids: number[],
    procPath = "/proc",
  ): Promise<Map<number, FileActivity>> {
    const out = new Map<number, FileActivity>();
    const nextPos = new Map<string, number>();

    for (const pid of pids) {
      const fdDir = join(procPath, String(pid), "fd");
      let fds: string[];
      try {
        fds = await readdir(fdDir);
      } catch {
        continue;
      }

      let best: { delta: number; activity: FileActivity } | null = null;
      for (const fd of fds.slice(0, FD_SCAN_CAP)) {
        let target: string;
        try {
          target = await readlink(join(fdDir, fd));
        } catch {
          continue;
        }
        if (!isTrackedFile(target)) continue;

        let info: FdInfo;
        try {
          info = parseFdInfo(
            await readFile(join(procPath, String(pid), "fdinfo", fd), "utf8"),
          );
        } catch {
          continue;
        }

        const key = `${pid}:${fd}:${target}`;
        nextPos.set(key, info.pos);
        const prev = this.prevPos.get(key);
        if (prev !== undefined && info.pos > prev) {
          const delta = info.pos - prev;
          if (!best || delta > best.delta) {
            best = {
              delta,
              activity: {
                path: target,
                dir: dirname(target),
                direction: directionFromFlags(info.flags),
              },
            };
          }
        }
      }
      if (best) out.set(pid, best.activity);
    }

    this.prevPos = nextPos;
    return out;
  }
}
