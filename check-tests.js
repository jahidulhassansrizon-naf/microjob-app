const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
console.log("=== package.json scripts ===");
console.log(pkg.scripts);
const dev = Object.keys(pkg.devDependencies || {}).filter((d) =>
  /jest|vitest|mocha|playwright|tsx|ts-node/.test(d),
);
console.log("test tools:", dev);

console.log("\n=== কোন test কোন ফাইল টেস্ট করছে ===");
for (const f of fs.readdirSync("tests")) {
  const text = fs.readFileSync(path.join("tests", f), "utf8");
  const imports = [
    ...text.matchAll(/(?:from\s+|require\()\s*["']([^"']+)["']/g),
  ].map((m) => m[1]);
  console.log(`\n${f}  (${text.split("\n").length} লাইন)`);
  imports.forEach((i) => console.log("   →", i));
}
