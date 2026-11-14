const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "_md_archive",
]);
const SKIP_FILES = new Set(["package-lock.json", "check-md.js"]);
const CODE_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".html",
  ".css",
  ".txt",
]);
// এই ফাইলগুলো টুলস/GitHub নিজে পড়ে, তাই কোডে না থাকলেও রাখতে হবে
const PROTECTED = new Set(["README.md", "CLAUDE.md", "AGENTS.md"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const all = walk(ROOT);
const mdFiles = all.filter((f) => f.toLowerCase().endsWith(".md"));
const codeFiles = all.filter((f) => {
  const base = path.basename(f);
  if (SKIP_FILES.has(base)) return false;
  const ext = path.extname(f).toLowerCase();
  return CODE_EXT.has(ext) || base.startsWith(".env") || base === ".gitignore";
});

// কোড ফাইলগুলো একবারই পড়ে নিচ্ছি
const contents = codeFiles
  .filter((f) => fs.statSync(f).size < 2 * 1024 * 1024)
  .map((f) => ({ file: f, text: fs.readFileSync(f, "utf8") }));

const used = [];
const unused = [];

for (const md of mdFiles) {
  const name = path.basename(md);
  const refs = contents
    .filter((c) => c.text.includes(name))
    .map((c) => path.relative(ROOT, c.file));
  const rel = path.relative(ROOT, md);
  if (refs.length) used.push({ rel, refs });
  else unused.push({ rel, protected: PROTECTED.has(name) });
}

console.log(`\nমোট .md ফাইল: ${mdFiles.length}\n`);
console.log("=== কোডে রেফারেন্স আছে (রাখুন) ===");
used.forEach((u) =>
  console.log(`✔ ${u.rel}\n    ← ${u.refs.slice(0, 3).join(", ")}`),
);
console.log("\n=== কোথাও ব্যবহার হয়নি (ডিলিট ক্যান্ডিডেট) ===");
unused.forEach((u) =>
  console.log(`${u.protected ? "⚠ (protected, রাখুন)" : "✘"} ${u.rel}`),
);
