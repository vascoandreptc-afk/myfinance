const test = require("node:test"), assert = require("node:assert");
const core = require("../src/core.js");
test("categoriza pela primeira regra que corresponde", () => {
  const regras = core.ruleList([["continente", "Supermercado"], ["galp", "Combustível"], ["150", "Poupança", "pessoal", 150]]);
  assert.equal(core.categorize({ descricao: "Continente Sintra", detalhe: "", valor: -12 }, regras, "pessoal"), "Supermercado");
  assert.equal(core.categorize({ descricao: "GALP", detalhe: "", valor: -50 }, regras, "pessoal"), "Combustível");
  assert.equal(core.categorize({ descricao: "Algo", detalhe: "", valor: 20 }, regras, "pessoal"), "Entradas");
  assert.equal(core.categorize({ descricao: "Algo", detalhe: "", valor: -20 }, regras, "pessoal"), "Outros");
});
test("regras por conta só se aplicam a essa conta", () => {
  const regras = core.ruleList([["mercado", "Supermercado", "conjunta"]]);
  assert.equal(core.categorize({ descricao: "mercado", detalhe: "", valor: -5 }, regras, "pessoal"), "Outros");
  assert.equal(core.categorize({ descricao: "mercado", detalhe: "", valor: -5 }, regras, "conjunta"), "Supermercado");
});
test("divide movimentos por mês da data-valor", () => {
  const out = core.splitMonths({ rows: [
    { data: "2026-09-30", dataValor: "2026-10-01", valor: -10, saldo: 90 },
    { data: "2026-10-05", dataValor: "2026-10-05", valor: -5, saldo: 85 },
    { data: "2026-11-01", dataValor: "2026-11-01", valor: 15, saldo: 100 }] });
  assert.deepEqual(Object.keys(out).sort(), ["2026-10", "2026-11"]);
  assert.equal(out["2026-10"].abertura, 100); assert.equal(out["2026-10"].fecho, 85);
});
test("tipos das categorias", () => {
  assert.equal(core.kindOf("Supermercado"), "despesa");
  assert.equal(core.kindOf("Entradas"), "entrada");
});
