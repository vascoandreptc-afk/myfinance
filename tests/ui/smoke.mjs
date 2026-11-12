// Teste da interface num browser (Chromium): entra, importa extratos fictícios e percorre todas as vistas,
// no Mac (largo) e no iPhone (estreito). Os dados vivem só na memória da página: não recarregar. Falha se a página lançar algum erro.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const F = require("../fixtures.js");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NM = p => require.resolve(p);
const tmp = fs.mkdtempSync(path.join((await import("node:os")).tmpdir(), "mf-ui-"));
const files = { "xtb.xlsx": F.xtbXLSX(), "cripto.pdf": await F.criptoPDF(), "revolut.pdf": await F.revolutPDF(), "xtb-conf.pdf": await F.xtbConfirmacaoPDF(),
  "optimize.pdf": await F.optimizePDF({ fundos: [{ nome: "Ativo", qty: "150", custo: "18", cot: "20", valia: "300", pct: "11", valor: "3,000.00" }, { nome: "Agressivo", qty: "100", custo: "20", cot: "26", valia: "600", pct: "30", valor: "2,600.00" }] }) };
for (const [n, b] of Object.entries(files)) fs.writeFileSync(path.join(tmp, n), b);

const MIME = { ".html": "text/html", ".js": "application/javascript", ".json": "application/json", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split("?")[0]); const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(s); });
await new Promise(r => srv.listen(0, "127.0.0.1", r)); const BASE = "http://127.0.0.1:" + srv.address().port + "/";

const falhas = []; const ok = (c, m) => { if (!c) falhas.push(m); console.log((c ? "  ✓ " : "  ✗ ") + m); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 950 }, serviceWorkers: "block" });
const page = await ctx.newPage(); const erros = [];
page.on("pageerror", e => erros.push(String(e)));
await page.route("**/*", r => { const u = r.request().url();
  if (u.includes("firebase-app-compat")) return r.fulfill({ path: path.join(ROOT, "tests/ui/fakefb.js"), contentType: "application/javascript" });
  if (u.includes("firebasejs")) return r.fulfill({ body: "", contentType: "application/javascript" });
  if (u.endsWith("/firebase-config.js") || u.includes("/firebase-config.js?")) return r.fulfill({ body: 'window.FIREBASE_CONFIG={apiKey:"t",authDomain:"x",projectId:"x",appId:"x"};', contentType: "application/javascript" });
  if (u.includes("pdf.worker.min.js")) return r.fulfill({ path: NM("pdfjs-dist/build/pdf.worker.min.js"), contentType: "application/javascript" });
  if (u.includes("pdf.min.js")) return r.fulfill({ path: NM("pdfjs-dist/build/pdf.min.js"), contentType: "application/javascript" });
  if (u.includes("xlsx.full.min.js")) return r.fulfill({ path: NM("xlsx/dist/xlsx.full.min.js"), contentType: "application/javascript" });
  if (u.startsWith(BASE)) return r.continue(); return r.abort(); });

try {
  console.log("Entrar");
  await page.goto(BASE); await page.waitForSelector("#gate", { state: "visible" });
  await page.fill("#login-email", "teste@exemplo.pt"); await page.fill("#login-pass", "segredo123"); await page.click("#login-go");
  await page.waitForFunction(() => /Atualizado/.test(document.getElementById("status").textContent), null, { timeout: 15000 });
  ok(true, "sessão iniciada e registos carregados");

  console.log("Importar extratos fictícios (Definições)");
  await page.click("#tab-definicoes"); await page.waitForTimeout(200); ok(await page.isVisible("#drop"), "roda dentada abre as Definições");
  for (const [n, espera] of [["revolut.pdf", /3 movimentos de outubro 2026 · saldos verificados/], ["xtb.xlsx", /XTB/], ["xtb-conf.pdf", /Confirmação da XTB/], ["cripto.pdf", /cripto/i], ["optimize.pdf", /Optimize|PPR/]]) {
    await page.setInputFiles("#imp-file", path.join(tmp, n));
    await page.waitForSelector("#imp-preview", { state: "visible", timeout: 15000 });
    const info = await page.textContent("#imp-info"); ok(espera.test(info), n + ": pré-visualização reconhece o ficheiro (" + info.slice(0, 60) + ")");
    await page.click("#imp-go"); await page.waitForFunction(() => document.getElementById("imp-msg").textContent.length > 5, null, { timeout: 15000 });
    console.log("    " + (await page.textContent("#imp-msg")).slice(0, 110));
  }
  await page.evaluate(() => firebase.firestore().collection("planos").doc("2026").set({ pessoal: { cats: { Supermercado: 300, "Combustível": 120 }, linhas: {} } }));

  console.log("Percorrer as vistas no Mac");
  await page.evaluate(() => location.hash = "financas"); await page.waitForTimeout(400);
  ok(/Supermercado|Combustível/.test(await page.textContent("#cat-rows")), "despesas vs orçamento mostra categorias");
  await page.click("#cat-rows button >> nth=0"); await page.waitForTimeout(200);
  ok((await page.textContent("#mov-count")).length > 0, "clicar numa categoria filtra os movimentos");
  for (const v of ["orcamentos", "plano", "poupanca", "investimentos", "definicoes"]) {
    await page.evaluate(h => location.hash = h, v); await page.waitForTimeout(250); ok(await page.isVisible("#v-" + v), "vista " + v);
  }
  ok(/OPT-PPR|PPR/.test(await page.textContent("#v-investimentos")), "PPR aparece nos investimentos");

  console.log("Tarefas automáticas");
  await page.evaluate(() => { const f = firebase.firestore();
    f.collection("ativos").doc("core~SXR8.DE").set({ ticker: "SXR8.DE", categoria: "ETF Core", valorAtual: 900, atualizado: "2026-11-03", valorEstimado: 955.5, estimadoEm: "2099-01-01" });
    f.collection("sync").doc("investimentos").set({ cripto: { ok: true, resumo: "BTC 0.015 = 1328 €", quando: new Date().toISOString() }, email: { ok: false, porConfigurar: true, quando: new Date().toISOString() } }); });
  await page.evaluate(() => location.hash = "investimentos"); await page.waitForTimeout(400);
  ok(/955,50/.test(await page.textContent("#v-investimentos")) && /estimado a/.test(await page.textContent("#v-investimentos")), "estimativa da XTB mais recente substitui o valor e aparece marcada");
  await page.evaluate(() => location.hash = "definicoes"); await page.waitForTimeout(200);
  const al = await page.textContent("#auto-line"); ok(/Revolut X/.test(al) && /por configurar/.test(al), "Definições mostram o estado das tarefas automáticas");

  console.log("iPhone");
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500);
  for (const t of ["resumo", "orcamento", "poupanca", "investimentos", "mais"]) {
    await page.click('#m-tabs button[data-t="' + t + '"]'); await page.waitForTimeout(150);
    ok((await page.textContent("#m-content")).length > 20, "separador " + t);
  }
} catch (e) { falhas.push(String(e)); console.error(e); }
ok(!erros.length, "sem erros na página" + (erros.length ? ": " + erros.join(" | ") : ""));
await browser.close(); srv.close();
if (falhas.length) { console.error("\n" + falhas.length + " falha(s)"); process.exit(1); } else console.log("\nInterface OK");
