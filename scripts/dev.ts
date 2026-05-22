const procs = [
  Bun.spawn(["bun", "--hot", "server/index.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  }),
  Bun.spawn(["bunx", "vite"], {
    stdout: "inherit",
    stderr: "inherit",
  }),
];

const shutdown = () => {
  for (const p of procs) p.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await Promise.race(procs.map((p) => p.exited));
shutdown();

export {};
