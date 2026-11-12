const test = require("node:test"), assert = require("node:assert");
const { execFileSync } = require("child_process"), path = require("path");
test("app.js corresponde aos ficheiros de src/", () => {
  execFileSync(process.execPath, [path.join(__dirname, "..", "build.js"), "--check"]);
});
test("app.js é JavaScript válido", () => {
  const src = require("fs").readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.doesNotThrow(() => new Function(src));
});
