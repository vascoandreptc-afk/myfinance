// Extratos FICTÍCIOS para os testes (nunca usar dados reais: o repositório é público).
const { PDFDocument, StandardFonts } = require("pdf-lib");
const XLSX = require("xlsx");

// PDF simples: cada linha é um texto numa posição (x, topo) numa página de 827 pt de largura.
async function pdfDeLinhas(paginas, { largura = 827, altura = 1170 } = {}) {
  const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const linhas of paginas) {
    const p = doc.addPage([largura, altura]);
    for (const l of linhas) p.drawText(l.t, { x: l.x ?? 50, y: altura - l.top, size: 9, font });
  }
  return Buffer.from(await doc.save());
}
const seq = (textos, top0 = 200, passo = 18) => textos.map((t, i) => ({ t, top: top0 + i * passo }));

function optimizePDF({ dia = 30, mes = "setembro", ano = 2026, fundos }) {
  return pdfDeLinhas([[...seq(["Extrato de fundos Optimize Investment Partners", "12345678 Teste Exemplo",
    "Total a " + dia + " de " + mes + " de " + ano],
    100), ...seq(fundos.map(f => "Optimize PPR " + f.nome + " " + f.qty + " " + f.custo + " € " + f.cot + " € " + f.valia + " € " + f.pct + " % " + f.valor + " €"), 300)]]);
}

function criptoPDF() {
  return pdfDeLinhas([seq([
    "Extrato da conta de criptomoedas",
    "01/10/2026 - 31/10/2026",
    "BTC Bitcoin 0,0123 90 000,00 € 1 107,00 € 85,00%",
    "ADA Cardano 300,5 0,50 € 150,25 € 15,00%",
    "BTC Compra 0,0012 85 000,00 € 102,00 € 1,53 € 05/10/2026, 10:12:00",
    "BTC Compra 0,00002 85 500,00 € 1,71 € 0,03 € 06/10/2026, 09:00:00",
    "BTC Compra 0,00003 86 000,00 € 2,58 € 0,04 € 20/10/2026, 09:00:00",
    "ADA Recompensa de staking 1,25 07/10/2026"
  ], 120)]);
}

// Extrato EUR da Revolut: colunas por posição x (data <225, descrição <460, retirado <575, recebido <690, saldo)
function revolutPDF() {
  const L = []; let top = 200; const add = (cols) => { for (const [x, t] of cols) L.push({ x, top, t }); top += 16; };
  add([[60, "Teste Exemplo"]]);
  add([[60, "Conta (Conta Corrente) 1 000,00€ 62,34€ 50,00€ 987,66€"]]);
  add([[60, "Operações da conta de 1 de outubro de 2026 a 31 de outubro de 2026"]]);
  add([[60, "Data"], [240, "Descrição"], [470, "Dinheiro retirado"], [590, "Dinheiro recebido"], [700, "Saldo"]]);
  add([[60, "01/10/2026 01/10/2026"], [240, "Continente"], [470, "12,34 €"], [700, "987,66 €"]]);
  add([[240, "Cartão: 1234"]]);
  add([[60, "02/10/2026 02/10/2026"], [240, "Transferência de Fulano"], [590, "50,00 €"], [700, "1 037,66 €"]]);
  add([[60, "15/10/2026 15/10/2026"], [240, "Galp"], [470, "50,00 €"], [700, "987,66 €"]]);
  return pdfDeLinhas([L]);
}

function xtbXLSX({ gerado = "2026-11-03 10:00:00" } = {}) {
  const wb = XLSX.utils.book_new();
  const op = [["Report generated", gerado], [], ["Product", "", "Symbol", "", "Type", "Volume", "Market value", "", "", "Open time", "", "", "", "Net profit"],
    ["Investment Plans", "", "SXR8.DE", "", "BUY", 1.5, 900, "", "", "2026-03-10 10:00:00", "", "", "", 100],
    ["Investment Plans", "", "RBOT.UK", "", "BUY", 10, 200, "", "", "2026-04-10 10:00:00", "", "", "", -10],
    ["Stocks", "", "AAPL.US", "", "BUY", 1, 210, "", "", "2026-05-02 10:00:00", "", "", "", 20]];
  const cash = [["Type", "ID", "", "", "Time", "Amount", "", "Comment", "Product"],
    ["Transfer", 1, "", "", "2026-10-02 10:00:00", 150, "", "Transfer to 52148668", "Investment Plans"],
    ["Transfer", 2, "", "", "2026-10-02 10:00:00", 49, "", "Transfer to 52137503", "Investment Plans"],
    ["Stock purchase", 3, "", "", "2026-05-02 10:00:00", -190, "", "AAPL", "My Trades"]];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(op), "Open Positions");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cash), "Cash Operations");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Firestore em memória com a mesma forma de chamada (collection().doc().set/get/delete)
function fakeDb() {
  const store = {}; const clone = o => JSON.parse(JSON.stringify(o));
  return { store,
    collection: c => ({ doc: id => ({ id,
      set: async d => { (store[c] = store[c] || {})[id] = clone(d); },
      delete: async () => { if (store[c]) delete store[c][id]; },
      get: async () => ({ exists: !!(store[c] && store[c][id]), data: () => store[c] && store[c][id] && clone(store[c][id]) }) }),
      get: async () => ({ docs: Object.entries(store[c] || {}).map(([id, d]) => ({ id, data: () => clone(d) })) }) }) };
}
// st ao estilo da app, a partir do fakeDb
function estado(db) {
  const s = db.store;
  return { db, lotes: Object.entries(s.lotes || {}).map(([id, d]) => ({ id, ...d })), ativos: { ...(s.ativos || {}) },
    real: Object.entries(s.realizados || {}).map(([id, d]) => ({ id, ...d })), hist: (s.historico || {}).carteira || null };
}
function pdfjs() {
  const lib = require("pdfjs-dist/legacy/build/pdf.js"); const path = require("path");
  const fonts = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts") + path.sep;
  return { getDocument: o => lib.getDocument({ ...o, verbosity: 0, standardFontDataUrl: fonts }) };
}

module.exports = { pdfDeLinhas, optimizePDF, criptoPDF, revolutPDF, xtbXLSX, fakeDb, estado, pdfjs, XLSX };
