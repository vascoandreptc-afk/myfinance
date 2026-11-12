/* ================= LEITORES E IMPORTADORES DE EXTRATOS =================
   XTB (Excel), cripto da Revolut (PDF) e Optimize (PDF).
   Usado pela app (browser) e pelas tarefas automáticas no GitHub (Node).
   st: {db, lotes, ativos, real, hist, xtbcfg} · db com a API collection().doc().set()/delete()
   opts.hoje(): data de hoje "AAAA-MM-DD" */
function mfImportadores(st,opts){
const MES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const eur=new Intl.NumberFormat("pt-PT",{style:"currency",currency:"EUR"});
const SLUG={"Cripto":"cri","ETF Core":"core","ETF Agressivo":"agr","XTB Manual":"man","PPR":"ppr"};
const todayStr=(opts&&opts.hoje)||(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");});
function curMonth(){return todayStr().slice(0,7);}
function mesLabel(m){const [y,mm]=m.split("-");return MES[+mm-1]+" "+y;}
function r2(v){return Math.round(v*100)/100;}
function akey(cat,t){return cat+"~"+t;}
function ativosByKey(){const m={};for(const id in st.ativos){const d=st.ativos[id];m[akey(d.categoria||"Cripto",d.ticker||id)]={id,doc:d};}return m;}
function histGroups(){return (st.hist&&st.hist.grupos)||{};}
const PLAN_DEFAULT_SUB={"52137503":"ETF Agressivo","52148668":"ETF Core"};
const AGR_DEFAULT=new Set(["RBOT.UK","XDWT.DE","LYPG.DE"]);
function slugT(t){return String(t).replace(/[^A-Za-z0-9_\-~:@+]/g,"_");}
function targetMonth(d){const iso=d.toISOString?d.toISOString().slice(0,10):String(d).slice(0,10);const y=+iso.slice(0,4),m=+iso.slice(5,7),day=+iso.slice(8,10);
  if(day<=5){const pm=m===1?12:m-1,py=m===1?y-1:y;return {m:py+"-"+String(pm).padStart(2,"0"),parcial:false};}
  return {m:iso.slice(0,7),parcial:iso.slice(0,7)===curMonth()};}
function addMonthOf(obj,m,v){obj[m]=(obj[m]||0)+v;}
function sheetRows(XLSX,wb,name){const ws=wb.Sheets[name];return ws?XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null}):null;}
function toDate(v){if(v&&typeof v.getTime==="function")return new Date(v.getTime());if(typeof v==="number")return new Date(Math.round((v-25569)*86400000));if(typeof v==="string"&&v)return new Date(v.replace(" ","T")+(v.length<=19?"Z":""));return null;}
function planGroupFor(ticker){
  const ex=st.lotes.find(l=>l.origem==="xtb"&&l.ticker===ticker&&(l.categoria==="ETF Core"||l.categoria==="ETF Agressivo"));
  if(ex)return ex.categoria;return AGR_DEFAULT.has(ticker)?"ETF Agressivo":"ETF Core";}
async function parseXTB(XLSX,buf){
  const wb=XLSX.read(new Uint8Array(buf),{type:"array",cellDates:true});
  const op=sheetRows(XLSX,wb,"Open Positions"),cash=sheetRows(XLSX,wb,"Cash Operations"),closed=sheetRows(XLSX,wb,"Closed Positions");
  if(!op||!cash)throw new Error("formato");
  let report=null;for(const r of op.slice(0,6))if(r[0]&&/report generated/i.test(String(r[0])))report=toDate(r[1]);
  report=report||new Date();
  const pos=[];const newT=[];
  for(const r of op){if(r[4]!=="BUY"||!r[2])continue;const prod=String(r[0]||"");
    let g;if(/^Investment/i.test(prod)){g=planGroupFor(r[2]);if(!st.lotes.some(l=>l.origem==="xtb"&&l.ticker===r[2])&&!AGR_DEFAULT.has(r[2]))newT.push(r[2]);}else g="XTB Manual";
    const val=+r[6]||0,net=+r[13]||0,ot=toDate(r[9]);pos.push({g,t:r[2],vol:+r[5]||0,val,inv:val-net,ot});}
  // aportes per group per month
  const ap={"ETF Core":{},"ETF Agressivo":{},"XTB Manual":{}};
  const subs={...PLAN_DEFAULT_SUB,...((st.xtbcfg&&st.xtbcfg.subcontas)||{})};
  for(const r of cash){const typ=r[0],when=toDate(r[4]),amt=+r[5]||0,com=String(r[7]||""),prod=String(r[8]||"");if(!when||!typ||typ==="Type")continue;const m=when.toISOString().slice(0,7);
    if(prod==="Investment Plans"&&/transfer/i.test(typ)){const mm=com.match(/to\s+(\d+)/);const g=(mm&&subs[mm[1]])||"ETF Core";addMonthOf(ap[g],m,amt);}
    if(prod==="My Trades"&&(typ==="Stock purchase"||typ==="Stock sell"))addMonthOf(ap["XTB Manual"],m,-amt);}
  // realised
  const real={};
  if(closed)for(const r of closed){if(!r[1]||r[0]==="Instrument"||r[0]==="Profit/loss"||typeof r[10]!=="number")continue;const ct=toDate(r[8]);if(!ct)continue;
    const d=ct.toISOString().slice(0,10);const id="xtb-"+slugT(r[1]).toLowerCase()+"-"+d;const o=real[id]=real[id]||{data:d,ticker:r[1],plataforma:"XTB",resultado:0,cat:r[2],n:0};o.resultado+=r[10];o.n++;}
  return {tipo:"xtb",report,pos,ap,real,newT};
}
async function importXTB(r,msg){
  const tm=targetMonth(r.report);let n=0;
  // lots
  const agg={};for(const p of r.pos){const y=p.ot?p.ot.toISOString().slice(0,4):"0000";const k=p.g+"|"+p.t+"|"+y;const a=agg[k]=agg[k]||{g:p.g,t:p.t,y,inv:0,qty:0,d:"",n:0};a.inv+=p.inv;a.qty+=p.vol;a.n++;const d=p.ot?p.ot.toISOString().slice(0,10):"";if(d>a.d)a.d=d;}
  const keepL=new Set();
  for(const k in agg){const a=agg[k];const id="xtb-"+SLUG[a.g]+"-"+slugT(a.t)+"-"+a.y;keepL.add(id);
    await st.db.collection("lotes").doc(id).set({data:a.d||null,ticker:a.t,categoria:a.g,plataforma:"XTB",investido:r2(a.inv),quantidade:+a.qty.toFixed(6),nota:(a.g==="XTB Manual"?"Compras manuais":"Plano "+(a.g==="ETF Core"?"Core":"Agressivo"))+" de "+a.y+" ("+a.n+" posições)",origem:"xtb"});n++;}
  for(const l of st.lotes)if((l.origem==="xtb"||l.origem==="xtb-est")&&!keepL.has(l.id)){await st.db.collection("lotes").doc(l.id).delete();n++;}
  // ativos
  const av={};for(const p of r.pos){const id=SLUG[p.g]+"~"+p.t;av[id]=av[id]||{ticker:p.t,categoria:p.g,valorAtual:0};av[id].valorAtual+=p.val;}
  const day=r.report.toISOString().slice(0,10);
  for(const id in av){await st.db.collection("ativos").doc(id).set({...av[id],valorAtual:r2(av[id].valorAtual),atualizado:day});n++;}
  for(const id in st.ativos)if(/^(core|agr|man)~/.test(id)&&!av[id]){await st.db.collection("ativos").doc(id).delete();n++;}
  // realised
  for(const id in r.real){const o=r.real[id];await st.db.collection("realizados").doc(id).set({data:o.data,ticker:o.ticker,plataforma:"XTB",resultado:r2(o.resultado),nota:(o.cat==="CFD"?"CFD fechado":"Venda de "+(o.cat==="ETF"?"ETF":"ações"))+" ("+o.n+" "+(o.n>1?"posições":"posição")+")",origem:"xtb"});n++;}
  // history
  const H=JSON.parse(JSON.stringify(histGroups()));const tot={};for(const p of r.pos)tot[p.g]=(tot[p.g]||0)+p.val;
  for(const g of ["ETF Core","ETF Agressivo","XTB Manual"]){H[g]=H[g]||{};
    for(const m in r.ap[g]){H[g][m]=H[g][m]||{};H[g][m].a=r2(r.ap[g][m]);delete H[g][m].aBase;}
    H[g][tm.m]=H[g][tm.m]||{};H[g][tm.m].v=r2(tot[g]||0);delete H[g][tm.m].est;if(tm.parcial)H[g][tm.m].parcial=true;else delete H[g][tm.m].parcial;}
  await st.db.collection("historico").doc("carteira").set({...(st.hist||{}),grupos:H});
  msg.textContent="XTB importada: "+r.pos.length+" posições, "+Object.keys(r.real).length+" resultados realizados e o valor de "+(tm.parcial?"hoje":"fecho de "+mesLabel(tm.m))+" nos investimentos."+(r.newT.length?" Novos ETF nos planos ("+[...new Set(r.newT)].join(", ")+") ficaram no Core; muda a categoria do lote se forem do Agressivo.":"");
}
/* ---- extrato de cripto (Revolut) ---- */
async function parseCripto(lib,buf){
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;const lines=[];
  for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const tc=await page.getTextContent();const it=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({x:i.transform[4],y:i.transform[5],s:i.str}));
    it.sort((a,b)=>b.y-a.y||a.x-b.x);let cur=null;for(const i of it){if(!cur||Math.abs(cur.y-i.y)>3){cur={y:i.y,p:[]};lines.push(cur);}cur.p.push(i);}}
  const txt=lines.map(l=>l.p.sort((a,b)=>a.x-b.x).map(i=>i.s).join(" ").replace(/\s+/g," ").trim());
  const num=s=>parseFloat(String(s).replace(/[\s .]/g,"").replace("€","").replace(",","."));
  const ops=[],stk=[],val={};let periodo=null;
  for(const t of txt){let m;
    if((m=t.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/))&&!periodo)periodo={ini:m[3]+"-"+m[2]+"-"+m[1],fim:m[6]+"-"+m[5]+"-"+m[4]};
    if((m=t.match(/^([A-Z0-9]{2,8})\s+(Compra|Comprar(?:\s*-\s*Revolut X)?|Venda|Vender(?:\s*-\s*Revolut X)?)\s+([\d,]+)\s+([\d\s .]+,\d+)\s*€\s+([\d\s .]+,\d+)\s*€\s+([\d\s .]*\d,\d+)\s*€\s+(\d{2})\/(\d{2})\/(\d{4}),?\s*([\d:]+)/))){
      ops.push({sym:m[1],tipo:/^Vend/.test(m[2])?"venda":"compra",rx:/Revolut X/.test(m[2]),qty:num(m[3]),preco:num(m[4]),valor:num(m[5]),fee:num(m[6]),data:m[9]+"-"+m[8]+"-"+m[7],hora:m[10]});continue;}
    if((m=t.match(/^([A-Z0-9]{2,8})\s+Recompensa de staking\s+([\d,]+)\s+(\d{2})\/(\d{2})\/(\d{4})/))){stk.push({sym:m[1],qty:num(m[2]),data:m[5]+"-"+m[4]+"-"+m[3]});continue;}
    if((m=t.match(/^([A-Z0-9]{2,8})\s+[A-Za-zÀ-ÿ .]+?\s+([\d,]+)\s+([\d\s .]+,\d+)\s*€\s+([\d\s .]+,\d+)\s*€\s+[\d.,]+%$/))){val[m[1]]={qty:num(m[2]),preco:num(m[3]),valor:num(m[4])};}
  }
  return {tipo:"cripto",ops,stk,val,periodo};
}
async function importCripto(r,msg){
  let n=0;const MESL=m=>mesLabel(m);
  const by={};for(const o of r.ops.filter(o=>o.tipo==="compra")){const big=o.valor>=100||o.rx;if(big){const id=o.sym.toLowerCase()+"-"+o.data;const b=by[id]=by[id]||{sym:o.sym,data:o.data,inv:0,qty:0,n:0,rx:o.rx,big:true};b.inv+=o.valor+o.fee;b.qty+=o.qty;b.n++;}
    else{const m=o.data.slice(0,7);const id="trocos-"+o.sym+"-"+m;const b=by[id]=by[id]||{sym:o.sym,data:"",inv:0,qty:0,n:0,m};b.inv+=o.valor+o.fee;b.qty+=o.qty;b.n++;if(o.data>b.data)b.data=o.data;}}
  for(const id in by){const b=by[id];const ex=st.lotes.find(l=>l.id===id);
    await st.db.collection("lotes").doc(id).set({data:b.data,ticker:b.sym,categoria:"Cripto",plataforma:b.rx?"Revolut X":"Revolut",investido:r2(b.inv),quantidade:+b.qty.toFixed(8),nota:b.big?(ex&&ex.nota?ex.nota:"Compra pontual"):"Trocos de "+MESL(b.m)+" ("+b.n+" compras)",origem:"cripto"});n++;}
  const sy={};for(const s of r.stk){const id=s.sym.toLowerCase()+"-staking-"+s.data.slice(0,4);const b=sy[id]=sy[id]||{sym:s.sym,qty:0,n:0,data:""};b.qty+=s.qty;b.n++;if(s.data>b.data)b.data=s.data;}
  for(const id in sy){const b=sy[id];await st.db.collection("lotes").doc(id).set({data:b.data,ticker:b.sym,categoria:"Cripto",plataforma:"Revolut",investido:0,quantidade:+b.qty.toFixed(8),nota:"Recompensas de staking "+id.slice(-4)+" ("+b.n+")",origem:"cripto"});n++;}
  for(const o of r.ops.filter(o=>o.tipo==="venda")){const id=o.sym.toLowerCase()+"-venda-"+o.data;if(st.real.some(x=>x.id===id))continue;
    await st.db.collection("realizados").doc(id).set({data:o.data,ticker:o.sym,plataforma:"Revolut",resultado:0,nota:"Venda de "+o.qty+" "+o.sym+" por "+eur.format(o.valor-o.fee)+". Indica o resultado (preço de venda menos custo de compra)",origem:"cripto"});n++;}
  const day=r.periodo?r.periodo.fim:todayStr();
  for(const sym in r.val){const AK=ativosByKey()[akey("Cripto",sym)];const id=AK?AK.id:sym;await st.db.collection("ativos").doc(id).set({ticker:sym,categoria:"Cripto",valorAtual:r2(r.val[sym].valor),atualizado:day});n++;}
  // history for BTC / ADA groups
  const tm=targetMonth(new Date(day+"T12:00:00Z"));const H=JSON.parse(JSON.stringify(histGroups()));
  for(const g of ["BTC","ADA"]){const ap={};for(const o of r.ops)if(o.sym===g&&o.tipo==="compra")addMonthOf(ap,o.data.slice(0,7),o.valor+o.fee);
    if(!r.val[g]&&!Object.keys(ap).length)continue;H[g]=H[g]||{};
    for(const m in ap){H[g][m]=H[g][m]||{};H[g][m].a=r2(ap[m]);}
    if(r.val[g]){H[g][tm.m]=H[g][tm.m]||{};H[g][tm.m].v=r2(r.val[g].valor);delete H[g][tm.m].est;if(tm.parcial)H[g][tm.m].parcial=true;else delete H[g][tm.m].parcial;}}
  await st.db.collection("historico").doc("carteira").set({...(st.hist||{}),grupos:H});
  msg.textContent="Cripto importada: "+r.ops.length+" operações, "+r.stk.length+" recompensas de staking e o valor atual de "+Object.keys(r.val).join(", ")+".";
}
const PPR_NOMES={AGRES:"Agressivo",AGRESSIVO:"Agressivo",ATIVO:"Ativo",EQUIL:"Equilibrado",EQUILIBRADO:"Equilibrado",MODER:"Moderado",MODERADO:"Moderado",LEOPARDO:"Leopardo"};
async function parseOptimize(lib,buf){
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;const lines=[];
  for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const tc=await page.getTextContent();
    const it=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({x:i.transform[4],y:i.transform[5],s:i.str}));it.sort((a,b)=>b.y-a.y||a.x-b.x);
    let cur=null;for(const i of it){if(!cur||Math.abs(cur.y-i.y)>3){cur={y:i.y,p:[]};lines.push(cur);}cur.p.push(i);}}
  const txt=lines.map(l=>l.p.sort((a,b)=>a.x-b.x).map(i=>i.s).join(" ").replace(/\s+/g," ").trim());
  const n=s=>parseFloat(String(s).replace(/,/g,""));
  let fim=null,titular="";const fundos=[];
  for(const t of txt){let m;
    if((m=t.match(/Total a (\d{1,2}) de ([A-Za-zçÇ]+) de (\d{4})/))){const mi=MES.indexOf(m[2].toLowerCase());if(mi>=0)fim=m[3]+"-"+String(mi+1).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0");}
    if(!titular&&(m=t.match(/^\d{8}\s+([A-ZÀ-Ý][a-zà-ÿ]+)/)))titular=m[1];
    if((m=t.match(/^Optimize PPR ([A-Za-zÀ-ÿ]+)\s+([\d.,]+)\s+([\d.,]+)\s*€\s+([\d.,]+)\s*€\s+(-?[\d.,]+)\s*€\s+(-?[\d.,]+)\s*%\s+([\d.,]+)\s*€/))){
      const k=m[1].toUpperCase();fundos.push({ticker:"OPT-PPR-"+(PPR_NOMES[k]||m[1]).toUpperCase(),nome:"PPR "+(PPR_NOMES[k]||m[1]),qty:n(m[2]),custo:n(m[3]),cotacao:n(m[4]),valia:n(m[5]),valor:n(m[7])});}}
  return {tipo:"optimize",fim,titular,fundos};
}
async function importOptimize(r,msg){
  const mes=r.fim.slice(0,7);const H=JSON.parse(JSON.stringify(histGroups()));
  for(const f of r.fundos){const custoTot=r2(f.qty*f.custo);
    const AK=ativosByKey()[akey("PPR",f.ticker)];const aid=AK?AK.id:"ppr~"+f.ticker;
    if(!(AK&&AK.doc.atualizado&&AK.doc.atualizado>r.fim))await st.db.collection("ativos").doc(aid).set({ticker:f.ticker,categoria:"PPR",nome:f.nome,titular:r.titular||"",valorAtual:r2(f.valor),unidades:f.qty,atualizado:r.fim});
    const ser=H[f.ticker]=H[f.ticker]||{};ser[mes]={...(ser[mes]||{}),v:r2(f.valor),c:custoTot};delete ser[mes].est;delete ser[mes].parcial;
    await pprRebuild(f.ticker,ser,r.titular);}
  await st.db.collection("historico").doc("carteira").set({...(st.hist||{}),grupos:H});
  msg.textContent="PPR importado: "+r.fundos.map(f=>f.nome+" "+eur.format(f.valor)).join(" · ")+" (fecho de "+mesLabel(mes)+").";
}
// entregas de cada mês = diferença do custo total; um lote por mês com entrega (funciona em qualquer ordem de importação)
async function pprRebuild(ticker,ser,titular){
  let pc=null;const lots={};
  for(const m of Object.keys(ser).sort()){if(ser[m].c==null)continue;
    if(pc!=null)ser[m].a=r2(ser[m].c-pc);else delete ser[m].a;
    const ent=pc==null?ser[m].c:ser[m].c-pc;if(ent>0.004)lots["opt-"+ticker+"-"+m]={data:m+"-28",ticker,categoria:"PPR",plataforma:"Optimize",investido:r2(ent),quantidade:null,nota:(pc==null?"Primeira entrega":"Entrega")+" · "+mesLabel(m)+(titular?" · "+titular:""),origem:"optimize"};
    pc=ser[m].c;}
  for(const l of st.lotes)if(l.ticker===ticker&&l.origem==="optimize"&&!lots[l.id])await st.db.collection("lotes").doc(l.id).delete();
  for(const id in lots)await st.db.collection("lotes").doc(id).set(lots[id]);
}
return {parseXTB,importXTB,parseCripto,importCripto,parseOptimize,importOptimize,pprRebuild,targetMonth,PPR_NOMES};
}
if(typeof module!=="undefined")module.exports={mfImportadores};
