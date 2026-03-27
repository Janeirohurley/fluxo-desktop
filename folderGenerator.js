import fs from "fs";
import path from "path";
import prompts from "prompts";

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

function createIndexFile(dirPath) {
  const indexPath = path.join(dirPath, "index.ts");
  const content = "// Auto-generated module index\n";

  try {
    fs.writeFileSync(indexPath, content, { flag: "wx" });
    console.log(`  -> index.ts created in: ${dirPath}`);
  } catch {
    // Ignore if the file already exists.
  }
}

async function resolveModuleName() {
  const cliName = process.argv[2]?.trim();
  if (cliName) {
    return cliName;
  }

  const response = await prompts({
    type: "text",
    name: "parentName",
    message: "What module name do you want to create? (ex: auth, assets)",
    validate: (value) =>
      value.trim().length > 0 ? true : "Module name cannot be empty.",
  });

  return response.parentName?.trim() ?? "";
}

async function generateFolders() {
  const moduleName = await resolveModuleName();

  if (!moduleName) {
    console.log("Operation cancelled.");
    return;
  }

  const baseDir = path.join("src", "modules", moduleName);
  let createdCount = 0;
  let fileCount = 0;

  if (!fs.existsSync(baseDir)) {
    console.log(`\nCreating module root: ${baseDir}`);
    fs.mkdirSync(baseDir, { recursive: true });
    createdCount += 1;
  } else {
    console.log(`\nModule root already exists: ${baseDir}`);
  }

  createIndexFile(baseDir);
  fileCount += 1;

  directoriesToCreate.forEach((subDir) => {
    const fullDirPath = path.join(baseDir, subDir);

    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
      console.log(`- Created: ${fullDirPath}`);
      createdCount += 1;
    }

    createIndexFile(fullDirPath);
    fileCount += 1;
  });

  console.log(`\nModule \"${moduleName}\" scaffold completed inside src/modules/.`);
  console.log(`Created ${createdCount} directories and ${fileCount} index files.`);
}

generateFolders().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
