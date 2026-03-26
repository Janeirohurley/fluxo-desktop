import fs from "fs";
import path from "path";
import prompts from "prompts";

// Définissez la liste des sous-dossiers
const directoriesToCreate = [
  "api",
  "components",
  "constants",
  "hooks",
  "pages",
  "store",
  "types",
  "layout",
  "common"
];

// Fonction utilitaire pour créer un fichier index.ts vide
function createIndexFile(dirPath) {
  const indexPath = path.join(dirPath, "index.ts");
  // Le contenu initial peut être vide ou contenir un commentaire
  const content = `// Index du module généré automatiquement\n`;
  try {
    fs.writeFileSync(indexPath, content, { flag: "wx" }); // 'wx' signifie écrire seulement si le fichier n'existe pas
    console.log(`  -> Fichier index.ts créé dans : ${dirPath}`);
  } catch (error) {
    // Ignore si le fichier existe déjà
  }
}

async function generateFolders() {
  const response = await prompts({
    type: "text",
    name: "parentName",
    message:
      "Quel nom souhaitez-vous donner au module (ex: auth, userProfile) ?",
    validate: (value) =>
      value.trim().length > 0 ? true : `Le nom ne peut pas être vide.`,
  });

  const moduleName = response.parentName.trim();

  if (!moduleName) {
    console.log("Opération annulée.");
    return;
  }

  const baseDir = path.join("src", "modules", moduleName);
  let createdCount = 0;
  let fileCount = 0;

  // 1. Assurez-vous que le dossier de base existe
  if (!fs.existsSync(baseDir)) {
    console.log(`\nLe dossier parent "${baseDir}" n'existe pas. Création...`);
    fs.mkdirSync(baseDir, { recursive: true });
    createdCount++;
  } else {
    console.log(
      `\nLe dossier parent "${baseDir}" existe déjà. Vérification des sous-dossiers et fichiers manquants...`
    );
  }

  // Crée le fichier index.ts DANS le dossier parent
  createIndexFile(baseDir);
  fileCount++;

  // 2. Parcours et création des sous-dossiers et de leur index.ts
  directoriesToCreate.forEach((subDir) => {
    const fullDirPath = path.join(baseDir, subDir);

    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
      console.log(`- Créé : ${fullDirPath}`);
      createdCount++;
    } else {
      // console.log(`- Existe déjà (ignoré) : ${fullDirPath}`);
    }

    // Crée le fichier index.ts DANS le sous-dossier
    createIndexFile(fullDirPath);
    fileCount++;
  });

  console.log(
    `\nStructure pour "${moduleName}" complétée avec succès dans "src/modules/"!`
  );
  console.log(
    `Total: ${createdCount} dossiers et ${fileCount} fichiers index.ts créés ou mis à jour.`
  );
}

generateFolders().catch(console.error);
