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
const signaturePath = path.resolve(
  __dirname,
  "..",
  "src-tauri",
  "target",
  "release",
  "bundle",
  "msi",
  `fluxo-desktop_${version}_x64_en-US.msi.zip.sig`,
);

if (!fs.existsSync(signaturePath)) {
  console.error(`Erreur : fichier de signature non trouve a ${signaturePath}`);
  process.exit(1);
}

const updateData = {
  version,
  notes: `Mise a jour automatique vers la version ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: fs.readFileSync(signaturePath, "utf8").trim(),
      url: `${repoUrl}/fluxo-desktop_${version}_x64_en-US.msi.zip`,
    },
  },
};

fs.writeFileSync(
  path.resolve(process.cwd(), "update.json"),
  `${JSON.stringify(updateData, null, 2)}\n`,
  "utf8",
);

console.log(`update.json genere avec succes pour la version ${version}`);
