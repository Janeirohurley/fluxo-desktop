import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const packageJsonPath = path.resolve(rootDir, "package.json");
const cargoTomlPath = path.resolve(rootDir, "src-tauri", "Cargo.toml");
const tauriConfigPath = path.resolve(rootDir, "src-tauri", "tauri.conf.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function syncCargoVersion(cargoToml, version) {
  const packageVersionPattern = /^version = ".*"$/m;

  if (!packageVersionPattern.test(cargoToml)) {
    throw new Error('Could not find a top-level `version = "..."` entry in src-tauri/Cargo.toml');
  }

  return cargoToml.replace(packageVersionPattern, `version = "${version}"`);
}

const packageJson = readJson(packageJsonPath);
const version = packageJson.version;

if (!version) {
  throw new Error("package.json does not define a version");
}

const cargoToml = fs.readFileSync(cargoTomlPath, "utf8");
const nextCargoToml = syncCargoVersion(cargoToml, version);

const tauriConfig = readJson(tauriConfigPath);
tauriConfig.version = version;

fs.writeFileSync(cargoTomlPath, nextCargoToml, "utf8");
writeJson(tauriConfigPath, tauriConfig);

console.log(`Synchronized Tauri version to ${version}`);
