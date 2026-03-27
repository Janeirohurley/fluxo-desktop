import fs from "node:fs";
import path from "node:path";

const [, , rawTag, outputFile = "release-notes.md"] = process.argv;

if (!rawTag) {
  console.error("Usage: node scripts/extract-release-notes.js <tag> [outputFile]");
  process.exit(1);
}

const version = rawTag.startsWith("v") ? rawTag.slice(1) : rawTag;
const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");

if (!fs.existsSync(changelogPath)) {
  console.error(`CHANGELOG.md not found at ${changelogPath}`);
  process.exit(1);
}

const changelog = fs.readFileSync(changelogPath, "utf8");
const versionHeadingPattern = new RegExp(
  `^#{2,3}\\s+\\[?${version.replace(/\./g, "\\.")}\\]?([^\\n]*)$`,
  "m",
);
const headingMatch = versionHeadingPattern.exec(changelog);

if (!headingMatch || headingMatch.index === undefined) {
  console.error(`Could not find version ${version} in CHANGELOG.md`);
  process.exit(1);
}

const sectionStart = headingMatch.index;
const afterHeading = changelog.slice(sectionStart);
const nextVersionHeadingMatch = afterHeading
  .slice(1)
  .match(/\n#{2,3}\s+\[?\d+\.\d+\.\d+\]?([^\n]*)/);
const sectionEnd = nextVersionHeadingMatch
  ? sectionStart + 1 + nextVersionHeadingMatch.index
  : changelog.length;
const section = changelog.slice(sectionStart, sectionEnd).trim();

fs.writeFileSync(path.resolve(process.cwd(), outputFile), `${section}\n`, "utf8");
