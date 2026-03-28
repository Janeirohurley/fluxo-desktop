import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , version] = process.argv;

if (!version) {
  console.error("Usage: node scripts/generate-updater-json.js <version>");
  process.exit(1);
}

const repoUrl = `https://github.com/JaneiroHurley/fluxo-desktop/releases/download/v${version}`;
const bundleDirectory = path.resolve(
  __dirname,
  "..",
  "src-tauri",
  "target",
  "release",
  "bundle",
);

function collectSignatureFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSignatureFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".sig")) {
      files.push(entryPath);
    }
  }

  return files;
}

function pickPreferredSignatureFile(signatureFiles, currentVersion) {
  const normalizedVersion = currentVersion.toLowerCase();
  const versionMatches = signatureFiles.filter((filePath) =>
    path.basename(filePath).toLowerCase().includes(normalizedVersion),
  );
  const candidates = versionMatches.length > 0 ? versionMatches : signatureFiles;
  const priorityPatterns = [/\.msi\.zip\.sig$/i, /\.nsis\.zip\.sig$/i, /\.app\.tar\.gz\.sig$/i];

  for (const pattern of priorityPatterns) {
    const match = candidates.find((filePath) => pattern.test(filePath));
    if (match) {
      return match;
    }
  }

  return candidates[0] ?? null;
}

const signatureFiles = collectSignatureFiles(bundleDirectory);
const signaturePath = pickPreferredSignatureFile(signatureFiles, version);

if (!signaturePath) {
  console.error(`Erreur : aucun fichier de signature trouve dans ${bundleDirectory}`);
  process.exit(1);
}

const artifactFileName = path.basename(signaturePath, ".sig");

const updateData = {
  version,
  notes: `Mise a jour automatique vers la version ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: fs.readFileSync(signaturePath, "utf8").trim(),
      url: `${repoUrl}/${artifactFileName}`,
    },
  },
};

fs.writeFileSync(
  path.resolve(process.cwd(), "update.json"),
  `${JSON.stringify(updateData, null, 2)}\n`,
  "utf8",
);

console.log(`update.json genere avec succes pour la version ${version} depuis ${artifactFileName}`);
