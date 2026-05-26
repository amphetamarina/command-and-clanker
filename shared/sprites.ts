export const BUILDING_NAMES = [
  "foerderturm",
  "kraftwerk",
  "raffinerie",
  "treibhaus",
] as const;

export const BUILDING_VARIANTS = [1, 2, 3] as const;

export type BuildingName = (typeof BUILDING_NAMES)[number];
export type BuildingVariant = (typeof BUILDING_VARIANTS)[number];

export const TOOL_NAMES = [
  "bun",
  "claude",
  "codex",
  "hermes",
  "nodejs",
  "opencode",
  "tail",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];
export type ToolSpriteKey = `tool/${ToolName}`;

export type BuildingSpriteKey =
  | `building/${BuildingName}/${BuildingVariant}`
  | ToolSpriteKey;

export const BUILDING_SPRITE_KEYS: readonly Exclude<
  BuildingSpriteKey,
  ToolSpriteKey
>[] = BUILDING_NAMES.flatMap((name) =>
  BUILDING_VARIANTS.map((v) => `building/${name}/${v}` as const),
);

export const TOOL_SPRITE_KEYS: readonly ToolSpriteKey[] = TOOL_NAMES.map(
  (n) => `tool/${n}` as ToolSpriteKey,
);

const TOOL_BY_BASENAME: Record<string, ToolName> = {
  bun: "bun",
  claude: "claude",
  codex: "codex",
  hermes: "hermes",
  node: "nodejs",
  nodejs: "nodejs",
  opencode: "opencode",
  tail: "tail",
};

const TOOL_BY_KEYWORD: ReadonlyArray<readonly [string, ToolName]> = [
  ["/claude/", "claude"],
  ["/codex/", "codex"],
  ["opencode", "opencode"],
  ["hermes", "hermes"],
];

export function toolFor(path: string): ToolName | null {
  const base = (path.split("/").pop() ?? "").toLowerCase();
  if (base in TOOL_BY_BASENAME) return TOOL_BY_BASENAME[base]!;
  const lower = path.toLowerCase();
  for (const [keyword, name] of TOOL_BY_KEYWORD) {
    if (lower.includes(keyword)) return name;
  }
  return null;
}
