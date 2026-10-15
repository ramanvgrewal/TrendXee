import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Optional design-time dependency: SHARP_MODULE can point to an existing sharp
// installation. No image processing package is needed to build or run the site.
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || "sharp");
const publicDir = new URL("../public/", import.meta.url);
const readAsset = (name) => readFile(new URL(name, publicDir), "utf8");
const writeAsset = (name, value) => writeFile(new URL(name, publicDir), value);
const mark = await readAsset("brand/trendxee-mark.svg");
const icon = mark
  .replace("<title>TrendXee woven X</title>", '<title>TrendXee</title><rect width="64" height="64" rx="14" fill="#F1EBDE"/>')
  .replace('fill="#B96947"', 'fill="#2B211B"');

await writeAsset("favicon.svg", icon);
await sharp(Buffer.from(mark)).resize(512, 512).png().toFile(fileURLToPath(new URL("brand/trendxee-mark.png", publicDir)));
await sharp(Buffer.from(icon)).resize(32, 32).png().toFile(fileURLToPath(new URL("favicon-32.png", publicDir)));
// iOS applies its own corner mask: supply a fully opaque square with extra space.
const touch = icon.replace('rx="14"', '').replace('<g fill=', '<g transform="translate(5 5) scale(0.84375)" fill=');
await sharp(Buffer.from(touch)).resize(180, 180).png().toFile(fileURLToPath(new URL("apple-touch-icon.png", publicDir)));

// ICO with PNG entries for standard and high-density browser tabs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(Buffer.from(icon)).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((png, i) => {
  const entry = 6 + i * 16;
  header[entry] = header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeAsset("favicon.ico", Buffer.concat([header, ...images]));
console.log("Exported TrendXee SVG, PNG, ICO and Apple touch assets.");
