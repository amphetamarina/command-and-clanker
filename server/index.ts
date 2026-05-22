import { scanDirectory } from "./scanner.ts";
import { buildDistrict } from "./world-builder.ts";

const PORT = Number(process.env.TTY_API_PORT ?? 3001);
const TARGET = process.env.TTY_TARGET ?? "/usr/bin";

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/world") {
      const started = performance.now();
      const manifest = await scanDirectory(TARGET);
      const buildings = buildDistrict(manifest, { district: TARGET });
      const elapsedMs = Math.round(performance.now() - started);
      console.log(
        `[world] ${TARGET}: ${buildings.length} buildings in ${elapsedMs}ms`,
      );
      return Response.json({ district: TARGET, buildings });
    }

    return new Response("not found", { status: 404 });
  },
});

console.log(`[server] listening on http://localhost:${server.port}`);
console.log(`[server] target district: ${TARGET}`);
