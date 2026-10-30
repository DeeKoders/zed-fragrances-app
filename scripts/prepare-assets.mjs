// Copies brand and product assets from the website repo and prepares them for the app bundle:
// reference posters become WebP, the app icon, adaptive icon and splash are generated from the
// official logo (centred on ink-950, never redrawn). Run with `npm run assets` after the website's
// images change. Logo and emblem files are copied byte for byte.
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const WEBSITE = process.env.WEBSITE_REPO ?? path.join(homedir(), "Projects", "zed-fragrances");
const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const INK_950 = "#050505";

const from = (...parts) => path.join(WEBSITE, "public", ...parts);
const to = (...parts) => path.join(ASSETS, ...parts);

async function copy(source, target) {
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log("copied", path.relative(ROOT, target));
}

async function webp(source, target, quality = 82) {
  await mkdir(path.dirname(target), { recursive: true });
  await sharp(source).webp({ quality, effort: 6 }).toFile(target);
  console.log("webp  ", path.relative(ROOT, target));
}

/** The official logo, scaled to `scale` of a square canvas filled with ink-950. */
async function logoOn(size, scale, target, background = INK_950) {
  const inner = Math.round(size * scale);
  const logo = await sharp(from("brand", "zed-logo.png")).resize(inner, inner).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(target);
  console.log("icon  ", path.relative(ROOT, target));
}

async function main() {
  if (!existsSync(WEBSITE)) throw new Error(`Website repo not found at ${WEBSITE} (set WEBSITE_REPO).`);

  for (const file of ["zed-logo.png", "zed-wordmark.png", "zed-wordmark-alpha.png"]) {
    await copy(from("brand", file), to("brand", file));
  }
  for (const file of ["lotus.svg", "lion-crowned.svg"]) {
    await copy(from("brand", "emblems", file), to("brand", "emblems", file));
  }

  for (const file of await readdir(from("images", "reference"))) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    await webp(from("images", "reference", file), to("images", "reference", file.replace(/\.[^.]+$/, ".webp")));
  }

  for (const slug of await readdir(from("images", "products"))) {
    const dir = from("images", "products", slug);
    if (!(await stat(dir)).isDirectory()) continue;
    for (const file of await readdir(dir)) {
      const source = path.join(dir, file);
      if (file === "props") {
        for (const prop of await readdir(source)) {
          if (prop.endsWith(".png")) await copy(path.join(source, prop), to("images", "products", slug, "props", prop));
        }
      } else if (file === "bottle.png") {
        await copy(source, to("images", "products", slug, file));
      } else if (/^(hero|gallery-.*)\.jpe?g$/i.test(file)) {
        await webp(source, to("images", "products", slug, file.replace(/\.[^.]+$/, ".webp")));
      }
    }
  }

  await mkdir(to("app"), { recursive: true });
  // iOS icons can't be transparent; the logo already carries its own margin.
  await logoOn(1024, 1, to("app", "icon.png"));
  // Android adaptive icons crop to a circle/squircle inside the middle ~66%.
  await logoOn(1024, 0.72, to("app", "adaptive-icon.png"));
  await logoOn(1024, 1, to("app", "splash.png"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
