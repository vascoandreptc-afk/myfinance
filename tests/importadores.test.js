const test = require("node:test"), assert = require("node:assert");
const F = require("./fixtures.js");
const { mfImportadores } = require("../src/importadores.js");
const { parseRevolutPDF } = require("../src/revolut-pdf.js");
const hoje = () => "2026-11-12";
const msg = () => ({ textContent: "" });
const buf = b => new Uint8Array(b);

test("Optimize: lê fundos, data e titular", async () => {
  const pdf = await F.optimizePDF({ fundos: [{ nome: "Ativo", qty: "150.1234", custo: "18.5000", cot: "20.2963", valia: "269.73", pct: "9.71", valor: "3,046.88" }] });
  const r = await mfImportadores({}, { hoje }).parseOptimize(F.pdfjs(), buf(pdf));
  assert.equal(r.fim, "2026-09-30"); assert.equal(r.titular, "Teste");
  assert.equal(r.fundos.length, 1); assert.equal(r.fundos[0].ticker, "OPT-PPR-ATIVO"); assert.equal(r.fundos[0].valor, 3046.88);
});

test("Optimize: importar meses fora de ordem dá o mesmo resultado (erro do −40%)", async () => {
  const mk = async (mes, qty, custo, valor) => F.optimizePDF({ mes, fundos: [{ nome: "Ativo", qty, custo, cot: "20", valia: "0", pct: "0", valor }] });
  const ago = await mk("agosto", "100", "15.00", "2,000.00"), set = await mk("setembro", "150", "16.00", "3,100.00");
  const correr = async (ordem) => {
    const db = F.fakeDb();
    for (const p of ordem) { const st = F.estado(db); const I = mfImportadores(st, { hoje }); await I.importOptimize(await I.parseOptimize(F.pdfjs(), buf(p)), msg()); }
    return db.store;
  };
  const a = await correr([ago, set]), b = await correr([set, ago]);
  const sa = a.historico.carteira.grupos["OPT-PPR-ATIVO"], sb = b.historico.carteira.grupos["OPT-PPR-ATIVO"];
  assert.deepEqual(sa, sb);
  assert.equal(sa["2026-09"].a, 900); // 150×16 − 100×15
  assert.equal(a.ativos["ppr~OPT-PPR-ATIVO"].valorAtual, 3100); assert.equal(b.ativos["ppr~OPT-PPR-ATIVO"].valorAtual, 3100);
  assert.deepEqual(Object.keys(a.lotes).sort(), Object.keys(b.lotes).sort());
});

test("Cripto Revolut: compras, trocos, staking e valor atual", async () => {
  const db = F.fakeDb(); const I = mfImportadores(F.estado(db), { hoje });
  const r = await I.parseCripto(F.pdfjs(), buf(await F.criptoPDF()));
  assert.equal(r.ops.length, 3); assert.equal(r.stk.length, 1); assert.equal(r.val.BTC.valor, 1107); assert.equal(r.periodo.fim, "2026-10-31");
  await I.importCripto(r, msg());
  const l = db.store.lotes;
  assert.ok(l["btc-2026-10-05"], "compra pontual"); assert.ok(l["trocos-BTC-2026-10"], "trocos agrupados no mês");
  assert.equal(l["trocos-BTC-2026-10"].investido, 4.36);
  assert.equal(db.store.ativos.BTC.valorAtual, 1107);
  assert.equal(db.store.historico.carteira.grupos.BTC["2026-10"].v, 1107);
});

test("XTB: posições por plano, aportes e fecho do mês anterior", async () => {
  const db = F.fakeDb(); const I = mfImportadores(F.estado(db), { hoje });
  const r = await I.parseXTB(F.XLSX, F.xtbXLSX());
  assert.equal(r.pos.length, 3);
  assert.deepEqual(r.pos.map(p => p.g), ["ETF Core", "ETF Agressivo", "XTB Manual"]);
  await I.importXTB(r, msg());
  const H = db.store.historico.carteira.grupos;
  assert.equal(H["ETF Core"]["2026-10"].v, 900); // extrato de 3 de novembro → fecho de outubro
  assert.equal(H["ETF Core"]["2026-10"].a, 150); assert.equal(H["ETF Agressivo"]["2026-10"].a, 49);
  assert.equal(db.store.ativos["agr~RBOT.UK"].valorAtual, 200);
});

test("Revolut EUR: movimentos, valores e resumo", async () => {
  const r = await parseRevolutPDF(F.pdfjs(), buf(await F.revolutPDF()));
  assert.equal(r.period, "2026-10");
  assert.deepEqual(r.rows.map(x => [x.data, x.descricao, x.valor]), [
    ["2026-10-01", "Continente", -12.34], ["2026-10-02", "Transferência de Fulano", 50], ["2026-10-15", "Galp", -50]]);
  assert.equal(r.summary["Conta (Conta Corrente)"].final, 987.66);
});

test("XTB: o extrato real apaga os lotes estimados e as marcas da estimativa", async () => {
  const db = F.fakeDb();
  await db.collection("lotes").doc("xtbest-core-SXR8.DE-2026-11").set({ ticker: "SXR8.DE", categoria: "ETF Core", investido: 100, quantidade: 0.1, origem: "xtb-est" });
  await db.collection("historico").doc("carteira").set({ grupos: { "ETF Core": { "2026-10": { a: 100, aBase: 50, est: true, v: 1 } } } });
  const I = mfImportadores(F.estado(db), { hoje });
  await I.importXTB(await I.parseXTB(F.XLSX, F.xtbXLSX()), msg());
  assert.ok(!db.store.lotes["xtbest-core-SXR8.DE-2026-11"], "lote estimado apagado");
  const e = db.store.historico.carteira.grupos["ETF Core"]["2026-10"];
  assert.equal(e.aBase, undefined); assert.equal(e.est, undefined); assert.equal(e.v, 900); assert.equal(e.a, 150);
});
