/* ================= IMPORTADORES XTB, CRIPTO E PPR (lógica em src/importadores.js) ================= */
async function xlsxLib(){if(window.XLSX)return window.XLSX;await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");return window.XLSX;}
const IMP=mfImportadores(st,{hoje:todayStr});
async function parseXTB(file){return IMP.parseXTB(await xlsxLib(),await file.arrayBuffer());}
const {importXTB,parseCripto,importCripto,parseOptimize,importOptimize,targetMonth,PPR_NOMES}=IMP;
