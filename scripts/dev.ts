import { spawn } from "node:child_process";

const procs = [
  spawn(
    "node",
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      "--watch",
      "server/index.ts",
    ],
    { stdio: "inherit" },
  ),
  spawn("node_modules/.bin/vite", [], { stdio: "inherit" }),
];

const shutdown = () => {
  for (const p of procs) p.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const p of procs) p.on("exit", shutdown);
