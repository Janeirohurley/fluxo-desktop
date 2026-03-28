const fs = require("fs");
const path = require("path");

const version = process.argv[2]; // Récupère la version passée par l'Action
const repoUrl =
  "https://github.com/JaneiroHurley/fluxo-desktop/releases/download/v" +
  version;

// Structure du fichier update.json
const updateData = {
  version: version,
  notes: "Mise à jour automatique vers la version " + version,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: "", // Sera rempli par le script
      url: `${repoUrl}/fluxo-desktop_${version}_x64_en-US.msi.zip`,
    },
  },
};

// Logique pour lire la signature .sig générée par Tauri sur Windows
const sigPath = path.join(
  __dirname,
  `../src-tauri/target/release/bundle/msi/fluxo-desktop_${version}_x64_en-US.msi.zip.sig`,
);

if (fs.existsSync(sigPath)) {
  updateData.platforms["windows-x86_64"].signature = fs
    .readFileSync(sigPath, "utf-8")
    .trim();
  fs.writeFileSync("update.json", JSON.stringify(updateData, null, 2));
  console.log("update.json généré avec succès !");
} else {
  console.error("Erreur : Fichier de signature non trouvé à " + sigPath);
  process.exit(1);
}
