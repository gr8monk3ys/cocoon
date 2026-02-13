import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const root = process.cwd();
const packageJson = readJson(resolve(root, "package.json"));
const manifestJson = readJson(resolve(root, "public/manifest.json"));

if (packageJson.version !== manifestJson.version) {
  throw new Error(
    `Version mismatch: package.json=${packageJson.version} public/manifest.json=${manifestJson.version}`
  );
}

execSync("npm run build", { stdio: "inherit" });

const artifactsDir = resolve(root, "artifacts");
if (!existsSync(artifactsDir)) {
  mkdirSync(artifactsDir, { recursive: true });
}

const outputName = `cocoon-v${packageJson.version}.zip`;
const outputPath = resolve(artifactsDir, outputName);

execSync(`rm -f ${outputPath}`);
execSync(`cd dist && zip -qr ${outputPath} .`);

console.log(`Packaged extension: ${outputPath}`);
