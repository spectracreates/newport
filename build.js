// Zero-dependency build: copies the static site in public/ to build/,
// which is where Vercel's existing "npm run build" setup expects it.
const fs = require("fs");
const path = require("path");
const src = path.join(__dirname, "public");
const out = path.join(__dirname, "build");
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
console.log("Built to build/");
