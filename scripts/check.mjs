import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "index.html",
  "scripts/storage.js",
  "scripts/dashboard.js",
  "scripts/memact.js",
  "styles/memact.css",
  "api/memact/_auth.js",
  "api/memact/fitness-context.js",
  "api/memact/propose-context.js",
  "api/memact/session.js"
];

for (const file of required) {
  await access(file, constants.R_OK);
}

const index = await readFile("index.html", "utf8");
for (const needle of ["scripts/memact.js", "styles/memact.css", "memact-connect-btn"]) {
  if (!index.includes(needle)) {
    throw new Error(`index.html is missing ${needle}`);
  }
}

const memactScript = await readFile("scripts/memact.js", "utf8");
for (const needle of ["async function buildConnectUrl", "async function proposeMissingContextToMemact", "/api/memact/fitness-context"]) {
  if (!memactScript.includes(needle)) {
    throw new Error(`memact.js is missing ${needle}`);
  }
}

console.log("NutriPlan check passed.");
