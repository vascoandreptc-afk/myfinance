/* ---------- import ---------- */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("load"));document.head.appendChild(s);});}
async function pdfLib(){if(window.pdfjsLib)return window.pdfjsLib;
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  return window.pdfjsLib;}
async function handleFile(file){
  const msg=$("imp-msg");msg.textContent="A ler o extrato…";$("imp-preview").hidden=true;st.pending=null;
  if(!file)return;
  if(/\.xlsx?$/i.test(file.name)){try{const r=await parseXTB(file);st.pending=r;$("imp-conta-wrap").hidden=true;
      $("imp-info").textContent="Extrato da XTB: "+r.pos.length+" posições abertas, "+Object.keys(r.real).length+" resultados realizados e aportes de "+Object.keys({...r.ap["ETF Core"],...r.ap["ETF Agressivo"],...r.ap["XTB Manual"]}).length+" meses. Atualiza lotes, valores atuais e rentabilidade.";
      $("imp-preview").hidden=false;msg.textContent="";}catch(e){msg.textContent="Não consegui ler este Excel. Usa a exportação do histórico da conta XTB em .xlsx.";}return;}
  try{
    const lib=await pdfLib();const buf=new Uint8Array(await file.arrayBuffer());
    const first=await (await (await lib.getDocument({data:buf.slice(),isEvalSupported:false}).promise).getPage(1)).getTextContent();
    if(first.items.some(i=>/fundos Optimize|Optimize Investment Partners/i.test(i.str))){const r=await parseOptimize(lib,buf.slice());st.pending=r;$("imp-conta-wrap").hidden=true;
      if(!r.fim||!r.fundos.length){msg.textContent="Não encontrei a situação detalhada dos PPR neste extrato da Optimize.";return;}
      $("imp-info").textContent="Extrato Optimize de "+mesLabel(r.fim.slice(0,7))+(r.titular?" ("+r.titular+")":"")+": "+r.fundos.map(f=>f.nome+" "+eur.format(f.valor)).join(" · ")+". Atualiza o valor, o total entregue e a rentabilidade.";
      $("imp-preview").hidden=false;msg.textContent="";return;}
    if(first.items.some(i=>/conta de criptomoedas/i.test(i.str))){const r=await parseCripto(lib,buf.slice());st.pending=r;$("imp-conta-wrap").hidden=true;
      if(!r.ops.length&&!Object.keys(r.val).length){msg.textContent="Não encontrei operações neste extrato de cripto.";return;}
      $("imp-info").textContent="Extrato de cripto da Revolut"+(r.periodo?" ("+fmtD(parseD(r.periodo.ini))+" a "+fmtD(parseD(r.periodo.fim))+")":"")+": "+r.ops.length+" operações, "+r.stk.length+" recompensas de staking. Atualiza os lotes com datas e quantidades reais e o valor atual.";
      $("imp-preview").hidden=false;msg.textContent="";return;}
    $("imp-conta-wrap").hidden=false;
    const r=await parseRevolutPDF(lib,buf);r.tipo="revolut";
    if(!r.rows.length){msg.textContent="Não encontrei movimentos. Confirma que é o extrato mensal de EUR da Revolut em PDF.";return;}
    // balance check
    let bad=0;const res=r.summary["Conta (Conta Corrente)"];
    if(res){let prev=res.inicial;for(const x of r.rows){if(x.saldo!=null&&Math.abs(r2(prev+x.valor)-x.saldo)>0.005)bad++;prev=x.saldo??prev;}}
    st.pending=r;r.split=splitMonths(r);const ms=Object.keys(r.split).sort();
    $("imp-conta").value=guessConta(r.holder);
    const span=ms.length>1?mesLabel(ms[0])+" a "+mesLabel(ms[ms.length-1])+" ("+ms.length+" meses)":mesLabel(ms[0]);
    $("imp-info").textContent=r.rows.length+" movimentos de "+span+(bad?" · atenção: "+bad+" saldos não batem certo":" · saldos verificados")+". Os meses que já existirem são atualizados.";
    $("imp-preview").hidden=false;msg.textContent="";
  }catch(e){msg.textContent="Não foi possível ler este PDF. Tenta exportar o extrato de novo na app da Revolut.";}
}
$("imp-file").addEventListener("change",e=>handleFile(e.target.files[0]));
const drop=$("drop");
drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("over");});
drop.addEventListener("dragleave",()=>drop.classList.remove("over"));
drop.addEventListener("drop",e=>{e.preventDefault();drop.classList.remove("over");const f=e.dataTransfer.files[0];if(f)handleFile(f);});
$("imp-cancel").addEventListener("click",()=>{st.pending=null;$("imp-preview").hidden=true;$("imp-file").value="";});
$("imp-go").addEventListener("click",async()=>{
  const r=st.pending;if(!r||!st.db)return;const btn=$("imp-go");btn.disabled=true;const msg=$("imp-msg");msg.textContent="A importar…";
  if(r.tipo!=="revolut"){try{if(r.tipo==="xtb")await importXTB(r,msg);else if(r.tipo==="optimize")await importOptimize(r,msg);else await importCripto(r,msg);st.pending=null;$("imp-preview").hidden=true;$("imp-file").value="";}
    catch(e){msg.textContent="A importação parou a meio. Volta a importar o mesmo ficheiro para completar.";}finally{btn.disabled=false;}return;}
  const conta=$("imp-conta").value;const lista=rules();const ms=Object.keys(r.split).sort();
  let nMov=0,troTot=0,done=0;
  try{
    for(const m of ms){const part=r.split[m];const did=conta+"-"+m;
      const old=st.meses[did];const manual={},excl={};if(old)for(const x of old.movimentos||[]){if(x.manual)manual[x.id]=x.categoria;if(x.excluido)excl[x.id]=true;}
      const seen={};
      const movs=part.rows.map(x=>{const id=rowId(x,seen);const mc=manual[id];const o={id,...x,categoria:mc||categorize(x,lista,conta),manual:!!mc};if(excl[id])o.excluido=true;return o;});
      const body={conta,mes:m,abertura:part.abertura,fecho:part.fecho,importado:todayStr(),movimentos:movs};
      if(ms.length===1&&r.summary&&Object.keys(r.summary).length)body.resumo=r.summary;
      await st.db.collection("meses").doc(did).set(body);nMov+=movs.length;
      const tro=movs.filter(x=>/conversão cambial para btc/i.test(x.descricao));
      if(tro.length){const tot=r2(tro.reduce((s,x)=>s-x.valor,0));troTot+=tot;const last=tro.map(x=>x.data).sort().pop();
        const lid=conta==="pessoal"?"trocos-BTC-"+m:"trocos-BTC-"+conta+"-"+m;
        const ex=st.lotes.find(l=>l.id===lid);if(ex&&ex.origem==="cripto")continue;
        await st.db.collection("lotes").doc(lid).set({data:last,ticker:"BTC",categoria:"Cripto",plataforma:"Revolut",investido:tot,quantidade:null,nota:"Trocos de "+mesLabel(m)+" ("+tro.length+" compras)",origem:"extrato"});}
      done++;msg.textContent="A importar… "+done+"/"+ms.length+" meses";}
    msg.textContent="Importado: "+nMov+" movimentos em "+ms.length+" "+(ms.length>1?"meses":"mês")+" na conta "+CONTA_LABEL[conta]+(troTot?", e "+eur.format(troTot)+" de Trocos em BTC.":".");
    st.conta=conta;for(const x of $("conta-pills").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x.dataset.c===conta));
    st.mes=ms[ms.length-1];st.ano=st.mes.slice(0,4);st.pending=null;$("imp-preview").hidden=true;$("imp-file").value="";
  }catch(e){msg.textContent=(done?"Importados "+done+" de "+ms.length+" meses. ":"")+(e&&e.code==="quota_exceeded"?"Atingiste o limite de dados desta página.":"Não foi possível importar o resto. Tenta de novo.");}
  finally{btn.disabled=false;}
});

