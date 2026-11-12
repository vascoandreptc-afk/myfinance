/* ---------- routing ---------- */
const VIEWS=["financas","orcamentos","plano","poupanca","investimentos","definicoes"];
function route(){const h=location.hash.slice(1);const v=VIEWS.includes(h)?h:"financas";
  for(const x of VIEWS){$("v-"+x).hidden=x!==v;const t=$("tab-"+x);if(t)t.setAttribute("aria-current",x===v||(x==="orcamentos"&&v==="plano")?"page":"false");}
  for(const b of document.querySelectorAll(".orc-modo button"))b.setAttribute("aria-pressed",String(b.dataset.v===v));}
window.addEventListener("hashchange",route);

/* ================= FINANÇAS ================= */
function monthKeys(){return Object.values(st.meses).filter(d=>d.conta===st.conta).map(d=>d.mes).sort();}
function monthStats(m){
  const doc=mdoc(m);const rows=doc?doc.movimentos||[]:[];
  const s={entradas:0,despesas:0,poupanca:0,investimento:0,reserva:0,cats:{},n:rows.length,excl:0,doc};
  for(const r of rows){if(r.excluido){s.excl++;continue;}const k=kindOf(r.categoria);
    if(k==="entrada")s.entradas+=r.valor;
    else if(k==="poupanca")s.poupanca-=r.valor;
    else if(k==="investimento")s.investimento-=r.valor;
    else if(k==="reserva")s.reserva-=r.valor;
    else if(k==="despesa"){s.despesas-=r.valor;s.cats[r.categoria]=(s.cats[r.categoria]||0)-r.valor;}}
  return s;
}
function aggStats(ks){if(!ks.length)return null;const a={entradas:0,despesas:0,poupanca:0,investimento:0,reserva:0,cats:{},n:0,excl:0,docs:[]};
  for(const k of ks){const s=monthStats(k);for(const f of ["entradas","despesas","poupanca","investimento","reserva","n","excl"])a[f]+=s[f];for(const c in s.cats)a.cats[c]=(a.cats[c]||0)+s.cats[c];if(s.doc)a.docs.push(s.doc);}
  a.doc=a.docs.length===1?a.docs[0]:null;return a;}
function periodKeys(){const keys=monthKeys();return st.mes?[st.mes].filter(k=>keys.includes(k)):keys.filter(k=>k.slice(0,4)===st.ano);}
function renderFin(){
  const keys=monthKeys();const years=[...new Set(keys.map(k=>k.slice(0,4)))].sort();
  if(!st.ano||!years.includes(st.ano))st.ano=years[years.length-1]||null;
  if(st.mes===null||(st.mes&&!keys.includes(st.mes))){const full=keys.filter(k=>k.slice(0,4)===st.ano&&k!==todayStr().slice(0,7));const yk=keys.filter(k=>k.slice(0,4)===st.ano);st.mes=full[full.length-1]||yk[yk.length-1]||"";}
  if(st.mes&&st.mes.slice(0,4)!==st.ano)st.ano=st.mes.slice(0,4);
  const asel=$("a-sel"),sel=$("m-sel");
  asel.innerHTML=years.length?years.slice().reverse().map(y=>'<option'+(y===st.ano?" selected":"")+'>'+y+'</option>').join(""):'<option>—</option>';asel.disabled=!years.length;
  const yk=keys.filter(k=>k.slice(0,4)===st.ano);
  sel.innerHTML=yk.length?'<option value=""'+(st.mes===""?" selected":"")+'>Ano inteiro</option>'+yk.map(k=>'<option value="'+k+'"'+(k===st.mes?" selected":"")+'>'+MES[+k.slice(5)-1]+(k===todayStr().slice(0,7)?" (em curso)":"")+'</option>').join(""):'<option>Sem extratos</option>';
  sel.disabled=!yk.length;
  const yearMode=st.mes==="";const pk=periodKeys();const s=aggStats(pk);
  let prevKey=null,p=null,prevLabel="";
  if(!yearMode&&st.mes){prevKey=keys[keys.indexOf(st.mes)-1]||null;if(prevKey){p=monthStats(prevKey);prevLabel=MES[+prevKey.slice(5)-1];}}
  else if(yearMode){const py=String(+st.ano-1);const pks=keys.filter(k=>k.slice(0,4)===py);if(pks.length){p=aggStats(pks);prevLabel=py;}}
  const nFull=pk.filter(k=>k!==todayStr().slice(0,7)).length||pk.length;
  const avgTxt=(v)=>yearMode&&nFull?" · "+eur0.format(v/nFull)+"/mês":"";
  const set=(id,v,sub,c)=>{$(id).textContent=v;if(c!==undefined)$(id).className="big "+c;$(id+"-sub").textContent=(sub||"").replace(/^ · /,"")||" ";};
  if(!s){["f-in","f-out","f-sav","f-inv","f-rate"].forEach(i=>set(i,"—","Importa o primeiro extrato"));$("m-saldo").textContent="";}
  else{
    const cmp=(a,b)=>p?(a-b>=0?"+":"−")+eur0.format(Math.abs(a-b))+" vs "+prevLabel:"";
    set("f-in",eur.format(s.entradas),(cmp(s.entradas,p&&p.entradas)||"")+avgTxt(s.entradas)||" ","big pos");
    set("f-out",eur.format(s.despesas),(cmp(s.despesas,p&&p.despesas)||s.n+" movimentos")+avgTxt(s.despesas)+(s.excl?" · "+s.excl+" excluídos":""));
    set("f-sav",eur.format(s.poupanca),yearMode?avgTxt(s.poupanca).slice(3)||" ":(s.reserva?eur0.format(s.reserva)+" reservados nos cofres":"sem contar investimentos"));
    set("f-inv",eur.format(s.investimento),yearMode?"XTB e cripto"+avgTxt(s.investimento):"XTB e cripto");
    const rate=s.entradas>0?s.poupanca/s.entradas:null;
    set("f-rate",rate==null?"—":pct.format(rate),yearMode?"do que entrou no ano":"do que entrou");
    const res=s.doc&&s.doc.resumo;const conta=res&&res["Conta (Conta Corrente)"],tot=res&&res["Total"];
    if(yearMode){const d0=s.docs[0],d1=s.docs[s.docs.length-1];$("m-saldo").textContent=d0&&d0.abertura!=null&&d1&&d1.fecho!=null?"Saldo da conta: "+eur.format(d0.abertura)+" → "+eur.format(d1.fecho)+" ("+pk.length+" meses)":"";}
    else $("m-saldo").textContent=conta?"Saldo da conta: "+eur.format(conta.inicial)+" → "+eur.format(conta.final)+(tot?" · total com cofres "+eur.format(tot.final):""):(s.doc.abertura!=null&&s.doc.fecho!=null?"Saldo da conta: "+eur.format(s.doc.abertura)+" → "+eur.format(s.doc.fecho):"");
  }
  renderBV(s,pk,yk,yearMode);
  renderTrend(yk.length?yk:keys);
  // top merchants
  const tl=$("top-list");tl.innerHTML="";
  if(s){const by={};for(const r of s.docs.flatMap(d=>d.movimentos||[]))if(!r.excluido&&kindOf(r.categoria)==="despesa"&&r.valor<0){const k=r.descricao.split(" Para:")[0].slice(0,40);by[k]=(by[k]||0)-r.valor;}
    const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,6);const tmax=top.length?top[0][1]:1;
    for(const [k,v] of top){const d=document.createElement("div");d.className="catrow";d.style.cursor="default";d.style.gridTemplateColumns="minmax(0,1fr) 70px auto";
      d.innerHTML='<span class="cname">'+esc(k)+'</span><span class="track"><span style="width:'+(v/tmax*100).toFixed(1)+'%;background:var(--c-out)"></span></span><span class="amt">'+eur.format(v)+'</span>';tl.appendChild(d);}
    if(!top.length)tl.innerHTML='<p class="note">Sem despesas.</p>';}
  else tl.innerHTML='<p class="note">Aparece depois do primeiro extrato.</p>';
  renderMov();renderRules();
}
/* ---------- Despesas vs orçamento (página principal) ---------- */
function catReal(k,c){const d=mdoc(k);if(!d)return 0;let v=0;for(const r of d.movimentos||[])if(!r.excluido&&r.categoria===c)v-=r.valor;return v;}
function bvReal(k,c){return c?catReal(k,c):monthStats(k).despesas;}
function renderBV(s,pk,yk,yearMode){
  const ano=st.ano,cur=todayStr().slice(0,7);const bud=budgetFor(st.conta,ano);const totB=Object.values(bud).reduce((a,b)=>a+(+b||0),0);
  const c=st.catFilter||"";const B=c?(+bud[c]||0):totB;const hasB=B>0;
  const head=$("bv-head"),ch=$("bv-chart"),cr=$("cat-rows");
  if(!s){head.innerHTML="";ch.innerHTML='<div class="empty">Aparece depois do primeiro extrato. Importa-o nas Definições (roda dentada, em cima à direita).</div>';cr.innerHTML="";$("cat-empty").hidden=true;return;}
  // KPIs
  const per=pk.reduce((a,k)=>a+bvReal(k,c),0);const perB=B*pk.length;
  const upto=st.mes?yk.filter(k=>k<=st.mes):yk;const ytd=upto.reduce((a,k)=>a+bvReal(k,c),0);const ytdB=B*upto.length;
  const done=upto.filter(k=>k!==cur);const ok=done.filter(k=>bvReal(k,c)<=B+0.005).length;
  const lbl=c?esc(c):"Todas as despesas";
  const restTxt=(r,b)=>hasB?(r<=b?'<span class="pos">sobram '+eur0.format(b-r)+'</span>':'<span class="neg">'+eur0.format(r-b)+' acima</span>'):"";
  let h='<div class="bv-sel"><div class="eyebrow" style="font-size:.82rem;color:var(--fg)">'+lbl+'</div>'+(c?'<button type="button" class="btn-link" id="bv-clear">Ver todas as despesas</button>':'')+'</div>';
  if(hasB){
    h+='<div class="bv-kpis"><div><span class="eyebrow">'+(yearMode?"No ano ("+pk.length+" meses)":(st.mes===cur?"Este mês (em curso)":"Em "+MES[+st.mes.slice(5)-1]))+'</span><span class="num">'+eur0.format(per)+' <span class="note">de '+eur0.format(perB)+'</span></span><small class="note">'+restTxt(per,perB)+'</small></div>'+
      (yearMode?(()=>{const fm=pk.filter(k=>k!==cur);const av=fm.length?fm.reduce((x,k)=>x+bvReal(k,c),0)/fm.length:0;return '<div><span class="eyebrow">Média por mês</span><span class="num">'+eur0.format(av)+' <span class="note">de '+eur0.format(B)+'</span></span><small class="note">'+restTxt(av,B)+(pk.includes(cur)?" · sem o mês em curso":"")+'</small></div>';})():
      '<div><span class="eyebrow">Acumulado '+ano+' até '+MES[+st.mes.slice(5)-1].slice(0,3)+'</span><span class="num">'+eur0.format(ytd)+' <span class="note">de '+eur0.format(ytdB)+'</span></span><small class="note">'+restTxt(ytd,ytdB)+'</small></div>')+
      '<div><span class="eyebrow">Meses dentro do orçamento</span><span class="num">'+ok+' de '+done.length+'</span><small class="note">'+(done.length?pct.format(ok/done.length):"—")+(upto.includes(cur)?" · sem contar o mês em curso":"")+'</small></div></div>';
  } else h+='<p class="note">'+(c?"A categoria "+lbl+" não tem orçamento":"Ainda não há orçamento")+' para '+ano+'. Define-o em <a href="#plano">Orçamento → Ano</a>. Para já vês só o real.</p>';
  head.innerHTML=h;
  // gráfico: 12 meses do ano, barras do real e linha do orçamento
  const months=Array.from({length:12},(_,i)=>ano+"-"+String(i+1).padStart(2,"0"));
  const vals=months.map(k=>yk.includes(k)?bvReal(k,c):null);
  const W=760,H=230,pl=52,pr=12,pt=12,pb=28;const vmax=Math.max(1,B*1.15,...vals.filter(v=>v!=null));const step=niceStep(vmax);const top=Math.ceil(vmax/step)*step;
  const y=v=>pt+(H-pt-pb)*(1-Math.max(0,v)/top);const gw=(W-pl-pr)/12;const bw=Math.min(34,gw*0.56);
  let g='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Real face ao orçamento por mês: '+lbl+'">';
  for(let v=0;v<=top+0.001;v+=step)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(v)+4).toFixed(1)+'" text-anchor="end">'+eur0.format(v).replace(/\s?€/,"")+'</text>';
  months.forEach((k,i)=>{const cx=pl+gw*i+gw/2;const v=vals[i];const sel=k===st.mes;
    if(v!=null)g+='<rect data-bm="'+k+'" x="'+(pl+gw*i).toFixed(1)+'" y="'+pt+'" width="'+gw.toFixed(1)+'" height="'+(H-pt-pb)+'" fill="transparent"/>';
    if(v!=null){const col=hasB?stateCol(v/B):"var(--c-out)";const part=k===cur;
      g+='<rect data-bm="'+k+'" x="'+(cx-bw/2).toFixed(1)+'" y="'+y(v).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,y(0)-y(v)).toFixed(1)+'" rx="3" fill="'+col+'" opacity="'+(part?.5:(st.mes&&!sel?.75:1))+'"'+(sel?' stroke="var(--fg)" stroke-width="1.5"':'')+'><title>'+mesLabel(k)+(part?" (em curso)":"")+': '+eur.format(v)+(hasB?' de '+eur.format(B)+' · '+(v<=B?"sobram "+eur.format(B-v):eur.format(v-B)+" acima"):"")+'</title></rect>';}
    g+='<text x="'+cx.toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle"'+(sel?' style="fill:var(--fg);font-weight:600"':'')+'>'+MES[i].slice(0,3)+'</text>';});
  if(hasB)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(B).toFixed(1)+'" y2="'+y(B).toFixed(1)+'" stroke="var(--muted)" stroke-width="1.8" stroke-dasharray="6 4"/><text x="'+(W-pr)+'" y="'+(y(B)-5).toFixed(1)+'" text-anchor="end" style="fill:var(--muted)">orçamento '+eur0.format(B)+'/mês</text>';
  ch.innerHTML=g+'</svg><p class="note">Clica numa barra para ver esse mês.'+(yk.includes(cur)?" O mês em curso aparece mais claro.":"")+'</p>';
  // linhas por categoria
  const nM=pk.length||1;const real={};for(const k of pk){const d=mdoc(k);for(const r of (d&&d.movimentos)||[])if(!r.excluido&&kindOf(r.categoria)==="despesa")real[r.categoria]=(real[r.categoria]||0)-r.valor;}
  let cats=[...new Set([...Object.keys(bud).filter(x=>+bud[x]>0),...Object.keys(real).filter(x=>Math.abs(real[x])>0.004)])];
  if(c&&!cats.includes(c))cats.push(c);
  cats=cats.map(x=>({c:x,r:real[x]!=null?real[x]:(x===c?pk.reduce((a,k)=>a+catReal(k,x),0):0),b:(+bud[x]||0)*nM})).sort((a,b)=>(b.r-a.r)||(b.b-a.b));
  const mx=Math.max(1,...cats.map(x=>Math.max(x.r,x.b)));cr.innerHTML="";
  for(const x of cats){const btn=document.createElement("button");btn.type="button";btn.className="catrow bvr";btn.setAttribute("aria-pressed",String(c===x.c));
    const ratio=x.b>0?x.r/x.b:null;const col=x.b>0?stateCol(ratio):"var(--c-out)";
    const chip=x.b>0?(x.r>x.b?'<span class="chip miss">+'+eur0.format(x.r-x.b)+'</span>':ratio>0.85?'<span class="chip wait">'+Math.round(ratio*100)+'%</span>':'<span class="chip ok">'+Math.round(ratio*100)+'%</span>'):'<span class="chip na">sem orçamento</span>';
    btn.innerHTML='<span class="cname">'+esc(x.c)+'</span><span class="track"><span style="width:'+Math.max(x.r>0?2:0,x.r/mx*100).toFixed(1)+'%;background:'+col+'"></span>'+(x.b>0?'<i style="left:calc('+(x.b/mx*100).toFixed(1)+'% - 1px)"></i>':'')+'</span><span class="amt">'+eur0.format(x.r)+(x.b>0?' <span class="delta" style="display:inline">/ '+eur0.format(x.b)+'</span>':'')+'</span><span class="chipc">'+chip+'</span>';
    btn.addEventListener("click",()=>{st.catFilter=st.catFilter===x.c?"":x.c;$("mov-cat").value=st.catFilter;renderFin();if(st.catFilter)$("bv").scrollIntoView({behavior:"smooth",block:"start"});});
    cr.appendChild(btn);}
  $("cat-empty").hidden=cats.length>0;
  $("cat-note").textContent=c?"A mostrar só "+c+". Os movimentos desta categoria estão em baixo. Clica outra vez na categoria para voltar ao total.":"Clica numa categoria para ver o gráfico e os movimentos só dessa categoria. A risca vertical marca o orçamento"+(yearMode?" dos meses do ano":"")+".";
}
document.addEventListener("click",e=>{
  const bm=e.target.closest("#bv-chart rect[data-bm]");if(bm){st.mes=bm.dataset.bm;renderFin();return;}
  if(e.target.closest("#bv-clear")){st.catFilter="";$("mov-cat").value="";renderFin();}
});
function renderTrend(keys){
  const el=$("trend");if(!keys.length){el.innerHTML='<div class="empty">O gráfico aparece com o primeiro extrato importado.</div>';return;}
  const ks=keys.slice(-12);const data=ks.map(k=>({k,...monthStats(k)}));
  const W=640,H=200,padL=48,padB=26,padT=10;const n=data.length;
  const vmax=Math.max(1,...data.map(d=>Math.max(d.entradas,d.despesas,d.poupanca)));
  const step=Math.pow(10,Math.floor(Math.log10(vmax)));const nice=[1,2,2.5,5,10].map(f=>f*step).find(v=>vmax/v<=5)||step*10;
  const top=Math.ceil(vmax/nice)*nice;const y=v=>padT+(H-padT-padB)*(1-v/top);
  const gw=(W-padL-8)/n;const bw=Math.min(22,gw/4.2);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Entradas, despesas e poupança por mês">';
  for(let v=0;v<=top+0.001;v+=nice){svg+='<line x1="'+padL+'" x2="'+(W-4)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(padL-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+eur0.format(v).replace(/\s?€/,"")+'</text>';}
  data.forEach((d,i)=>{const cx=padL+gw*i+gw/2;const bars=[[d.entradas,"var(--c-in)"],[d.despesas,"var(--c-out)"],[d.poupanca,"var(--accent)"]];
    bars.forEach(([v,c],j)=>{const x=cx+(j-1.5)*bw+bw*0.05*(j-1);const h=Math.max(0,y(0)-y(Math.max(0,v)));svg+='<rect x="'+x.toFixed(1)+'" y="'+y(Math.max(0,v)).toFixed(1)+'" width="'+(bw*0.92).toFixed(1)+'" height="'+h.toFixed(1)+'" rx="2" fill="'+c+'"><title>'+mesLabel(d.k)+': '+eur.format(v)+'</title></rect>';});
    svg+='<text x="'+cx+'" y="'+(H-8)+'" text-anchor="middle"'+(d.k===st.mes?' style="fill:var(--fg);font-weight:600"':'')+'>'+MES[+d.k.slice(5)-1].slice(0,3)+' '+d.k.slice(2,4)+'</text>';});
  svg+='</svg>';el.innerHTML=svg+(n===1?'<p class="note">Com mais meses importados vês aqui a evolução.</p>':'');
}
function catOptions(sel){const l=allCats();const extra=sel&&!l.find(c=>c.n===sel)?'<option selected>'+esc(sel)+'</option>':'';return extra+l.map(c=>'<option'+(c.n===sel?" selected":"")+'>'+esc(c.n)+'</option>').join("");}
function refreshCatSelects(){const cur=$("mov-cat").value;$("mov-cat").innerHTML='<option value="">Todas as categorias</option>'+allCats().map(c=>'<option'+(c.n===cur?" selected":"")+'>'+esc(c.n)+'</option>').join("");
  const rc=$("ru-cat").value;$("ru-cat").innerHTML=catOptions(rc||"Supermercado");}
function renderMov(){
  const tb=$("t-mov");tb.innerHTML="";
  const rows=periodKeys().flatMap(k=>(mdoc(k)?mdoc(k).movimentos||[]:[]).map(r=>({...r,_m:k}))).filter(r=>(!st.catFilter||r.categoria===st.catFilter)&&(!st.q||(r.descricao+" "+r.detalhe).toLowerCase().includes(st.q)));
  const sorted=rows.slice().sort((a,b)=>b.data.localeCompare(a.data));
  const LIMIT=200;
  for(const r of sorted.slice(0,LIMIT)){const tr=document.createElement("tr");
    const det=r.detalhe&&!/^Para: VIA VERDE$|^Purchase of BTC$/.test(r.detalhe)?'<div class="note">'+esc(r.detalhe.slice(0,90))+'</div>':'';
    if(r.excluido)tr.className="excl";
    tr.innerHTML='<td class="num">'+fmtDs(r.data)+'</td><td class="wrapcell">'+esc(r.descricao)+det+(r.excluido?' <span class="chip miss">excluído da análise</span>':'')+'</td>'+
      '<td><select aria-label="Categoria de '+esc(r.descricao)+'" '+(st.readonly?"disabled":"")+'>'+catOptions(r.categoria)+'</select>'+(r.manual?' <span class="chip na" title="Alterada à mão">manual</span>':'')+'<span class="applyrule"></span></td>'+
      '<td class="r num '+(r.valor>0?"pos":"")+'">'+signed(r.valor)+'</td>'+
      '<td class="r">'+(st.readonly?'':'<button type="button" class="btn-link" data-x>'+(r.excluido?"Incluir":"Excluir")+'</button>')+'</td>';
    tb.appendChild(tr);
    const sel=tr.querySelector("select");
    sel.addEventListener("change",()=>changeCat(r._m,r.id,sel.value,tr.querySelector(".applyrule"),r.descricao));
    const xb=tr.querySelector("[data-x]");if(xb)xb.addEventListener("click",()=>toggleExcl(r._m,r.id));
  }
  $("mov-empty").hidden=sorted.length>0;
  $("mov-count").textContent=sorted.length?(sorted.length+" movimento"+(sorted.length>1?"s":"")+(sorted.length>LIMIT?" (a mostrar "+LIMIT+")":"")):"";
}
async function saveMonth(id,movs){const doc=st.meses[id];await st.db.collection("meses").doc(id).set({...doc,movimentos:movs});}
async function changeCat(m,id,cat,slot,descricao){
  const did=st.conta+"-"+m;const doc=st.meses[did];const movs=doc.movimentos.map(r=>r.id===id?{...r,categoria:cat,manual:true}:r);
  try{await saveMonth(did,movs);setStatus("Categoria guardada.");}catch(e){setStatus("Não foi possível guardar a categoria.");return;}
  const key=descricao.toLowerCase().slice(0,40);
  slot.innerHTML='<button type="button" class="btn-link">Usar sempre para "'+esc(descricao.slice(0,24))+'"</button>';
  slot.querySelector("button").addEventListener("click",()=>addRule(key,cat,st.conta));
}
async function toggleExcl(m,id){const did=st.conta+"-"+m;const doc=st.meses[did];
  const movs=doc.movimentos.map(r=>r.id===id?{...r,excluido:!r.excluido}:r);
  try{await saveMonth(did,movs);setStatus("Análise atualizada.");}catch(e){setStatus("Não foi possível guardar.");}}
async function addRule(contem,categoria,conta){
  contem=String(contem||"").trim().toLowerCase();if(!contem)return;
  const nr=conta?{contem,categoria,conta}:{contem,categoria};
  const lista=[nr,...rules().filter(r=>!(r.contem===contem&&(r.conta||"")===(conta||"")))];
  try{await st.db.collection("config").doc("regras").set({lista});}catch(e){setStatus("Não foi possível guardar a regra.");return false;}
  await reapply(lista);setStatus('Regra "'+contem+'" → '+categoria+' aplicada.');return true;
}
async function reapply(lista){
  for(const id of Object.keys(st.meses)){const doc=st.meses[id];let changed=false;
    const movs=(doc.movimentos||[]).map(r=>{if(r.manual)return r;const c=categorize(r,lista,doc.conta);if(c!==r.categoria){changed=true;return {...r,categoria:c};}return r;});
    if(changed){try{await saveMonth(id,movs);}catch(e){setStatus("Não foi possível atualizar "+mesLabel(doc.mes)+".");}}}
}
function renderRules(){
  const list=rules();$("rule-count").textContent=list.length+" regras";
  const el=$("rule-list");el.innerHTML="";
  list.forEach((r,i)=>{const d=document.createElement("div");d.innerHTML='<code title="'+esc(r.contem)+'">'+esc(r.contem)+'</code><span class="muted" style="white-space:nowrap">'+esc(r.categoria)+(r.conta?' · '+CONTA_LABEL[r.conta]:'')+(r.valor!=null?' · '+eur0.format(r.valor):'')+'</span>'+(st.readonly?'':'<button type="button" class="btn-link danger" aria-label="Apagar regra '+esc(r.contem)+'">×</button>');
    el.appendChild(d);
    if(!st.readonly)d.querySelector("button").addEventListener("click",async()=>{const lista=rules().filter((_,j)=>j!==i);
      try{await st.db.collection("config").doc("regras").set({lista});await reapply(lista);}catch(e){setStatus("Não foi possível apagar a regra.");}});});
}
$("ru-cat").innerHTML=catOptions("Supermercado");
function renderCats(){const el=$("cat-list");el.innerHTML="";
  if(!CUSTOM_CATS.length){el.innerHTML='<div class="note" style="padding:8px 10px">Ainda não criaste categorias.</div>';}
  CUSTOM_CATS.forEach((c,i)=>{const d=document.createElement("div");d.innerHTML='<span>'+esc(c.n)+'</span><span class="muted" style="white-space:nowrap">'+esc(KINDS[c.k])+'</span>'+(st.readonly?'':'<button type="button" class="btn-link danger" aria-label="Apagar categoria '+esc(c.n)+'">×</button>');el.appendChild(d);
    if(!st.readonly)d.querySelector("button").addEventListener("click",async()=>{const lista=CUSTOM_CATS.filter((_,j)=>j!==i);try{await st.db.collection("config").doc("categorias").set({lista});}catch(e){setStatus("Não foi possível apagar a categoria.");}});});
  $("ca-tipo").innerHTML=Object.entries(KINDS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join("");}
$("f-cat").addEventListener("submit",async e=>{e.preventDefault();if(!st.db)return;const n=$("ca-nome").value.trim().replace(/\s+/g," ");const msg=$("ca-msg");
  if(!n){msg.textContent="Escreve o nome da categoria.";return;}
  if(allCats().some(c=>c.n.toLowerCase()===n.toLowerCase())){msg.textContent="Já existe uma categoria com esse nome.";return;}
  const lista=[...CUSTOM_CATS,{n,k:$("ca-tipo").value}];
  try{await st.db.collection("config").doc("categorias").set({lista});msg.textContent="Categoria criada.";$("ca-nome").value="";}catch(err){msg.textContent="Não foi possível criar a categoria.";}});
$("f-rule").addEventListener("submit",async e=>{e.preventDefault();if(!st.db)return;const t=$("ru-txt").value;
  if(!t.trim()){$("ru-msg").textContent="Escreve o texto a procurar na descrição.";return;}
  const ok=await addRule(t,$("ru-cat").value,$("ru-conta").value||null);if(ok){$("ru-msg").textContent="Regra adicionada.";$("ru-txt").value="";}});
$("conta-pills").addEventListener("click",e=>{const b=e.target.closest("button[data-c]");if(!b)return;st.conta=b.dataset.c;st.mes=null;st.catFilter="";$("mov-cat").value="";
  for(const x of $("conta-pills").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));renderFin();});
$("m-sel").addEventListener("change",e=>{st.mes=e.target.value;st.catFilter="";$("mov-cat").value="";renderFin();});
$("a-sel").addEventListener("change",e=>{st.ano=e.target.value;st.mes="";st.catFilter="";$("mov-cat").value="";renderFin();});
refreshCatSelects();
$("mov-cat").addEventListener("change",e=>{st.catFilter=e.target.value;renderFin();});
let qt;$("mov-q").addEventListener("input",e=>{clearTimeout(qt);qt=setTimeout(()=>{st.q=e.target.value.trim().toLowerCase();renderMov();},150);});

