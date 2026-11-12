/* ================= INVESTIMENTOS ================= */
function compute(){
  const byT={};const AK=ativosByKey();
  for(const l of st.lotes){const k=akey(l.categoria,l.ticker);(byT[k]=byT[k]||{lots:[],cat:l.categoria,t:l.ticker}).lots.push(l);}
  for(const k in AK){if(!byT[k])byT[k]={lots:[],cat:AK[k].doc.categoria||"Cripto",t:AK[k].doc.ticker||AK[k].id};}
  const assets=[];
  for(const k in byT){const a=byT[k];const t=a.t;const inv=a.lots.reduce((s,l)=>s+(+l.investido||0),0);
    const doc=AK[k]&&AK[k].doc;const cat=a.cat||"Cripto";
    const val=doc&&typeof doc.valorAtual==="number"?doc.valorAtual:inv;
    const allQty=a.lots.length>0&&a.lots.every(l=>+l.quantidade>0);const qtyT=a.lots.reduce((s,l)=>s+(+l.quantidade||0),0);
    for(const l of a.lots){const share=allQty?(+l.quantidade/qtyT):(inv>0?(+l.investido||0)/inv:0);l._val=val*share;l._res=l._val-(+l.investido||0);}
    assets.push({t,cat,inv,val,res:val-inv,upd:doc&&doc.atualizado,lots:a.lots,docId:AK[k]?AK[k].id:SLUG[cat]+"~"+t});}
  return assets;
}
function lotStatus(l,now){
  if(l.categoria==="PPR")return {html:'<span class="chip na">regime PPR</span>',exempt:null};
  if(l.categoria!=="Cripto")return {html:'<span class="chip na">28% sempre</span>',exempt:null};
  if(!l.data)return {html:'<span class="chip miss">Data por confirmar</span>',exempt:null};
  const ex=addYear(l.data);
  if(now>=ex)return {html:'<span class="chip ok">Isento</span>',exempt:true,ex};
  const left=Math.ceil((ex-now)/DAY);const done=Math.min(1,Math.max(0,1-left/365));
  return {html:'<span class="chip wait">faltam '+left+' dias</span><span class="progress" aria-hidden="true"><span style="width:'+(done*100).toFixed(0)+'%"></span></span>',exempt:false,ex,left};
}
function renderInv(){
  const assets=compute();const now=parseD(todayStr());
  const tot=assets.reduce((s,a)=>s+a.val,0),inv=assets.reduce((s,a)=>s+a.inv,0),res=tot-inv;
  const cripto=assets.filter(a=>a.cat==="Cripto").reduce((s,a)=>s+a.val,0);
  $("s-valor").textContent=eur.format(tot);$("s-valor-sub").textContent=assets.length+" ativo"+(assets.length===1?"":"s");
  $("s-inv").textContent=eur.format(inv);$("s-inv-sub").textContent=st.lotes.length+" lote"+(st.lotes.length===1?"":"s");
  $("s-res").textContent=signed(res);$("s-res").className="big "+cls(res);$("s-res-sub").textContent=inv>0?pct.format(res/inv)+" sobre o investido":" ";
  $("s-cripto").textContent=tot>0?pct.format(cripto/tot):"—";$("s-cripto-sub").textContent=eur.format(cripto)+" em cripto";
  const order=INV_ORDER;const cats={};for(const a of assets)cats[a.cat]=(cats[a.cat]||0)+a.val;
  const bar=$("alloc-bar"),leg=$("alloc-legend");bar.innerHTML="";leg.innerHTML="";
  for(const c of order){const v=cats[c]||0;
    if(tot>0&&v>0){const s=document.createElement("span");s.style.width=(v/tot*100)+"%";s.style.background=INV_COLOR[c];s.title=c;bar.appendChild(s);}
    const li=document.createElement("span");li.innerHTML='<i style="background:'+INV_COLOR[c]+'"></i>'+c+' <span class="num muted">'+(tot>0?pct.format(v/tot):"0,0%")+' · '+eur.format(v)+'</span>';leg.appendChild(li);}
  const tb=$("t-ativos");tb.innerHTML="";
  assets.sort((a,b)=>order.indexOf(a.cat)-order.indexOf(b.cat)||b.val-a.val);
  for(const a of assets){const tr=document.createElement("tr");
    tr.innerHTML='<td><span class="tick">'+esc(a.t)+'</span></td><td><span class="cat"><i style="background:'+INV_COLOR[a.cat]+'"></i>'+esc(a.cat)+'</span></td>'+
      '<td class="r num">'+eur.format(a.inv)+'</td>'+
      '<td class="r"><div class="valedit"><input id="v-'+esc(a.docId)+'" type="number" step="0.01" inputmode="decimal" value="'+a.val.toFixed(2)+'" aria-label="Valor atual de '+esc(a.t)+'" '+(st.readonly?"disabled":"")+'><button type="button" class="btn-link" hidden>Guardar</button></div>'+
      (a.upd?'<div class="note" style="text-align:right">atualizado '+fmtD(parseD(a.upd))+'</div>':'')+'</td>'+
      '<td class="r num '+cls(a.res)+'">'+signed(a.res)+'<div class="note" style="text-align:right">'+(a.inv>0?pct.format(a.res/a.inv):"")+'</div></td>'+
      '<td class="r num">'+(tot>0?pct.format(a.val/tot):"—")+'</td>';
    tb.appendChild(tr);const inp=tr.querySelector("input"),btn=tr.querySelector("button");
    inp.addEventListener("input",()=>{btn.hidden=false;});inp.addEventListener("keydown",e=>{if(e.key==="Enter")btn.click();});
    btn.addEventListener("click",()=>saveValor(a.docId,a.t,a.cat,inp.value,btn));}
  $("ativos-empty").hidden=assets.length>0;
  $("tickers").innerHTML=[...new Set(assets.map(a=>a.t))].map(t=>'<option value="'+esc(t)+'">').join("");
  let isento=0,trib=0,next=null,nextVal=0,missing=0;
  for(const a of assets){if(a.cat!=="Cripto")continue;for(const l of a.lots){const s=lotStatus(l,now);
    if(s.exempt===true)isento+=l._val;else{trib+=l._val;if(s.exempt===null)missing++;}
    if(s.exempt===false){if(next===null||s.ex<next){next=s.ex;nextVal=l._val;}else if(s.ex===next)nextVal+=l._val;}}}
  $("x-isento").textContent=eur.format(isento);$("x-trib").textContent=eur.format(trib);
  $("x-trib-sub").textContent=missing?missing+" lote"+(missing>1?"s":"")+" sem data":"menos de 365 dias";
  $("x-prox").textContent=next?fmtD(next):"—";$("x-prox-sub").textContent=next?eur.format(nextVal)+" passa a isento":"sem lotes à espera";
  const lt=$("t-lotes");lt.innerHTML="";
  const lots=st.lotes.filter(l=>st.filter==="all"||l.categoria===st.filter).sort((a,b)=>(b.data||"9999").localeCompare(a.data||"9999"));
  for(const l of lots){const s=lotStatus(l,now);const tr=document.createElement("tr");
    tr.innerHTML='<td class="num">'+(l.data?fmtD(parseD(l.data)):'<span class="muted">—</span>')+'</td>'+
      '<td><span class="tick">'+esc(l.ticker)+'</span>'+(l.nota?'<div class="note" style="white-space:normal;max-width:30ch">'+esc(l.nota)+'</div>':'')+'</td>'+
      '<td>'+esc(l.plataforma||"")+'</td><td class="r num">'+eur.format(+l.investido||0)+'</td><td class="r num">'+eur.format(l._val||0)+'</td>'+
      '<td class="r num '+cls(l._res)+'">'+signed(l._res||0)+'</td>'+
      '<td>'+s.html+(s.ex&&s.exempt===false?'<div class="note">a partir de '+fmtD(s.ex)+'</div>':'')+'</td>'+
      '<td class="r">'+(st.readonly?'':'<button type="button" class="btn-link" data-edit>Editar</button><button type="button" class="btn-link danger" data-del>Apagar</button>')+'</td>';
    lt.appendChild(tr);
    if(!st.readonly){tr.querySelector("[data-edit]").addEventListener("click",()=>startEdit(l));armDelete(tr.querySelector("[data-del]"),()=>st.db.collection("lotes").doc(l.id).delete());}}
  $("lotes-empty").hidden=lots.length>0;
  const rt=$("t-real");rt.innerHTML="";const years={};
  for(const r of [...st.real].sort((a,b)=>(b.data||"").localeCompare(a.data||""))){const y=(r.data||"").slice(0,4)||"—";years[y]=(years[y]||0)+(+r.resultado||0);
    const tr=document.createElement("tr");
    tr.innerHTML='<td class="num">'+(r.data?fmtD(parseD(r.data)):"—")+'</td><td><span class="tick">'+esc(r.ticker)+'</span></td><td>'+esc(r.plataforma||"")+'</td>'+
      '<td class="r num '+cls(+r.resultado)+'">'+signed(+r.resultado||0)+'</td><td class="wrapcell muted">'+esc(r.nota||"")+'</td>'+
      '<td class="r">'+(st.readonly?'':'<button type="button" class="btn-link danger" data-del>Apagar</button>')+'</td>';
    rt.appendChild(tr);if(!st.readonly)armDelete(tr.querySelector("[data-del]"),()=>st.db.collection("realizados").doc(r.id).delete());}
  $("real-empty").hidden=st.real.length>0;
  $("real-years").innerHTML=Object.keys(years).sort().reverse().map(y=>'<div class="year"><span>Total '+y+'</span><span class="num '+cls(years[y])+'">'+signed(years[y])+'</span></div>').join("");
}
function armDelete(btn,fn){let armed=false,t;
  btn.addEventListener("click",async()=>{if(!armed){armed=true;btn.textContent="Confirmar?";t=setTimeout(()=>{armed=false;btn.textContent="Apagar";},3500);return;}
    clearTimeout(t);btn.disabled=true;btn.textContent="A apagar…";try{await fn();}catch(e){btn.disabled=false;btn.textContent="Apagar";setStatus("Não foi possível apagar.");}});}
async function saveValor(docId,t,cat,raw,btn){const v=parseFloat(String(raw).replace(",","."));if(!isFinite(v)||v<0){btn.textContent="Valor inválido";return;}
  btn.disabled=true;btn.textContent="A guardar…";
  try{await st.db.collection("ativos").doc(docId).set({ticker:t,categoria:cat,valorAtual:r2(v),atualizado:todayStr()});btn.hidden=true;btn.textContent="Guardar";}
  catch(e){btn.textContent="Erro, tenta de novo";}finally{btn.disabled=false;}}
function startEdit(l){st.editing=l.id;$("f-title").textContent="Editar compra";$("l-submit").textContent="Guardar alterações";$("l-cancel").hidden=false;
  $("l-data").value=l.data||"";$("l-ticker").value=l.ticker;$("l-cat").value=l.categoria;$("l-plat").value=l.plataforma||"Revolut";
  $("l-inv").value=l.investido;$("l-qty").value=l.quantidade??"";$("l-nota").value=l.nota||"";$("l-msg").textContent="";
  $("f-lote").scrollIntoView({behavior:"smooth",block:"nearest"});$("l-data").focus();}
function resetLoteForm(){st.editing=null;$("f-lote").reset();$("l-data").value=todayStr();$("f-title").textContent="Registar compra";$("l-submit").textContent="Guardar compra";$("l-cancel").hidden=true;}
$("l-cancel").addEventListener("click",()=>{resetLoteForm();$("l-msg").textContent="";});
$("f-lote").addEventListener("submit",async e=>{e.preventDefault();const msg=$("l-msg");if(!st.db){msg.textContent="Os dados ainda não estão disponíveis.";return;}
  const t=tick($("l-ticker").value);const inv=parseFloat($("l-inv").value);const q=$("l-qty").value===""?null:parseFloat($("l-qty").value);
  if(!t){msg.textContent="Indica o ativo (ex.: BTC).";return;}if(!isFinite(inv)||inv<=0){msg.textContent="Indica o valor investido em euros.";return;}
  const body={data:$("l-data").value||null,ticker:t,categoria:$("l-cat").value,plataforma:$("l-plat").value,investido:r2(inv),quantidade:(q&&q>0)?q:null,nota:$("l-nota").value.trim()};
  const btn=$("l-submit");btn.disabled=true;const was=st.editing;
  try{if(was){const old=st.lotes.find(x=>x.id===was);await st.db.collection("lotes").doc(was).set({...(old&&old.origem?{origem:old.origem}:{}),...body});}
    else{await st.db.collection("lotes").add(body);const AK=ativosByKey()[akey(body.categoria,t)];
      if(!AK)await st.db.collection("ativos").doc(SLUG[body.categoria]+"~"+t).set({ticker:t,categoria:body.categoria,valorAtual:body.investido,atualizado:todayStr()});
      else if(typeof AK.doc.valorAtual==="number")await st.db.collection("ativos").doc(AK.id).update({valorAtual:r2(AK.doc.valorAtual+body.investido),atualizado:todayStr()});}
    msg.textContent=was?"Compra atualizada.":"Compra registada. O valor atual de "+t+" foi somado com o novo investimento.";resetLoteForm();}
  catch(err){msg.textContent=err&&err.code==="quota_exceeded"?"Atingiste o limite de registos.":"Não foi possível guardar. Tenta de novo.";}finally{btn.disabled=false;}});
$("f-real").addEventListener("submit",async e=>{e.preventDefault();const msg=$("r-msg");if(!st.db){msg.textContent="Os dados ainda não estão disponíveis.";return;}
  const t=tick($("r-ticker").value);const r=parseFloat($("r-res").value);
  if(!t){msg.textContent="Indica o ativo.";return;}if(!isFinite(r)){msg.textContent="Indica o resultado em euros (negativo se foi perda).";return;}
  try{await st.db.collection("realizados").add({data:$("r-data").value||todayStr(),ticker:t,plataforma:$("r-plat").value,resultado:r2(r),nota:$("r-nota").value.trim()});
    msg.textContent="Resultado registado.";$("f-real").reset();$("r-data").value=todayStr();}catch(err){msg.textContent="Não foi possível guardar. Tenta de novo.";}});
$("filters").addEventListener("click",e=>{const b=e.target.closest("button[data-f]");if(!b)return;st.filter=b.dataset.f;
  for(const x of $("filters").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));renderInv();});

