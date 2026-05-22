const PORT = Number(process.env.TTY_API_PORT ?? 3001);

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`[server] listening on http://localhost:${server.port}`);
