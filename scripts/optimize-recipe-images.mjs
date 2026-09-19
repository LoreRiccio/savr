import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.resolve("assets/images/recipes");
const outputDirectory = path.resolve("assets/images/recipes-optimized");

await mkdir(outputDirectory, { recursive: true });

const files = await readdir(sourceDirectory);
const pngFiles = files.filter((file) => file.toLowerCase().endsWith(".png"));

for (const file of pngFiles) {
  const sourcePath = path.join(sourceDirectory, file);
  const outputName = file.replace(/\.png$/i, ".webp");
  const outputPath = path.join(outputDirectory, outputName);

  await sharp(sourcePath)
    .resize(900, 900, {
      fit: "cover",
      position: "centre",
    })
    .webp({
      quality: 82,
      effort: 6,
    })
    .toFile(outputPath);

  console.log(`Ottimizzata: ${outputName}`);
}

console.log("Ottimizzazione completata.");
