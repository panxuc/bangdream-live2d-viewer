import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "components", "lib", "server", "tests"];
const PATTERNS = [
  { pattern: "<<<<<<<", message: "merge conflict marker" },
  { pattern: ">>>>>>>", message: "merge conflict marker" },
  { pattern: "=======", message: "merge conflict marker" },
  { pattern: "debugger;", message: "debugger statement" },
  { pattern: "console.log(", message: "console.log statement" },
];

async function collectFiles(directory) {
  const fullPath = path.join(ROOT, directory);
  const entries = await readdir(fullPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextRelativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(nextRelativePath));
      continue;
    }

    if (!/\.(js|jsx|json|mjs)$/.test(entry.name)) {
      continue;
    }

    files.push(nextRelativePath);
  }

  return files;
}

async function main() {
  const findings = [];

  for (const directory of TARGET_DIRS) {
    try {
      const directoryStat = await stat(path.join(ROOT, directory));
      if (!directoryStat.isDirectory()) continue;
    } catch {
      continue;
    }

    const files = await collectFiles(directory);
    for (const file of files) {
      const content = await readFile(path.join(ROOT, file), "utf8");
      for (const rule of PATTERNS) {
        if (content.includes(rule.pattern)) {
          findings.push(`${file}: found ${rule.message}`);
        }
      }
    }
  }

  if (findings.length > 0) {
    findings.forEach((finding) => console.error(finding));
    process.exitCode = 1;
    return;
  }

  console.log("lint: OK");
}

await main();
