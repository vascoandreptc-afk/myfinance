// Junta os ficheiros de src/ no app.js que o index.html carrega. Corre com: node build.js
// (ou "node build.js --check" para confirmar que o app.js está atualizado).
const fs = require("fs"), path = require("path");
const S = p => fs.readFileSync(path.join(__dirname, "src", p), "utf8");
const app = fs.readdirSync(path.join(__dirname, "src", "app")).filter(f => f.endsWith(".js")).sort();
const out = S("core.js") + S("revolut-pdf.js") + S("importadores.js") +
  "(function(){\n" + app.map(f => S("app/" + f)).join("") + "})();\n";
const dest = path.join(__dirname, "app.js");
if (process.argv.includes("--check")) {
  if (fs.readFileSync(dest, "utf8") !== out) { console.error("app.js desatualizado: corre node build.js"); process.exit(1); }
  console.log("app.js está atualizado.");
} else { fs.writeFileSync(dest, out); console.log("app.js gerado (" + app.length + " partes)."); }
