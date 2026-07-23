import { readFile, writeFile, mkdir } from "node:fs/promises";
import { transform, build } from "esbuild";

/** Dependency order. Later files may use anything above them. */
const FILES = [
  "src/game/types.ts",
  "src/game/constants.ts",
  "src/game/format.ts",
  "src/game/logic.ts",
  "src/game/state.ts",
  "src/game/save.ts",
  "src/ui/styles.ts",
  "src/ui/Sky.tsx",
  "src/ui/BuildPanel.tsx",
  "src/ui/ImprovePanel.tsx",
  "src/ui/CrunchPanel.tsx",
  "src/ui/MorePanel.tsx",
  "src/ui/TabBar.tsx",
  "src/ui/Toast.tsx",
  "src/ui/OfflineModal.tsx",
  "src/App.tsx",
];

const reactImports = new Set();
const chunks = [];

for (const file of FILES) {
  const source = await readFile(file, "utf8");
  const loader = file.endsWith(".tsx") ? "tsx" : "ts";
  const { code } = await transform(source, {
    loader,
    jsx: "preserve",
    format: "esm",
  });

  let body = code;

  // Collect and strip all import statements (esbuild has already removed
  // type-only ones; what's left is runtime imports).
  body = body.replace(
    /import\s+([\s\S]*?)\s+from\s*["']([^"']+)["'];?/g,
    (_, spec, path) => {
      if (path === "react") {
        const named = spec.match(/\{([\s\S]*?)\}/);
        if (named) {
          for (const name of named[1].split(",")) {
            const n = name.trim();
            if (n) reactImports.add(n);
          }
        }
      }
      return "";
    }
  );
  body = body.replace(/import\s*["'][^"']+["'];?/g, "");

  // Drop export keywords; the artifact exposes only App.
  body = body.replace(/export\s*\{[\s\S]*?\};?/g, "");
  body = body.replace(/^export default function App/m, "function App");
  body = body.replace(/^export\s+default\s+/gm, "");
  body = body.replace(/^export\s+(const|function|class|let|var|async)/gm, "$1");

  const bare = body.trim();
  if (bare.length > 0) {
    chunks.push("// ---- " + file + " ----\n" + bare);
  }
}

const header =
  "// Generic Idle Game 1 — flattened from " +
  FILES.length +
  " modules. Source of truth: the repo.\n";
const reactLine =
  reactImports.size > 0
    ? 'import { ' + [...reactImports].sort().join(", ") + ' } from "react";\n\n'
    : "";
const out =
  header + reactLine + chunks.join("\n\n") + "\n\nexport default App;\n";

await mkdir("dist-artifact", { recursive: true });
const outPath = "dist-artifact/generic-idle-game-1.jsx";
await writeFile(outPath, out, "utf8");

// Validate: must parse as JSX and resolve with only react external.
await build({
  entryPoints: [outPath],
  bundle: true,
  external: ["react", "react-dom"],
  write: false,
  format: "esm",
  loader: { ".jsx": "jsx" },
  jsx: "automatic",
  logLevel: "error",
});

const leftoverImports = [...out.matchAll(/^import .*$/gm)]
  .map((m) => m[0])
  .filter((l) => !l.includes('"react"'));
if (leftoverImports.length > 0) {
  console.error("Unexpected imports remain:", leftoverImports);
  process.exit(1);
}

console.log("flattened ->", outPath, "(" + out.length + " chars)");
console.log("react imports:", [...reactImports].sort().join(", "));
