/* ================= PLANO ANUAL ================= */
st.planos={};st.plConta="pessoal";st.plAno=null;st.plDraft=null;
function planOf(ano,conta){const p=st.planos[ano];return p&&p[conta]?p[conta]:null;}
function planYears(){const cy=+curMonth().slice(0,4);const ys=new Set([String(cy),String(cy+1),...Object.keys(st.planos)]);for(const d of Object.values(st.meses))ys.add(d.mes.slice(0,4));return [...ys].sort();}
function fullMonthsOf(conta,ano){return monthsOf(conta).filter(m=>m.slice(0,4)===ano&&!isPartial(m));}
function sumStats(conta,ms){const a={entradas:0,despesas:0,poupado:0,investido:0,cats:{}};for(const m of ms){const s=statsFor(conta,m);if(!s)continue;a.entradas+=s.entradas;a.despesas+=s.despesas;a.poupado+=s.poupado;a.investido+=s.investido;for(const c in s.cats)a.cats[c]=(a.cats[c]||0)+s.cats[c];}return a;}
function renderPlano(){
  const ys=planYears();const cy=+curMonth().slice(0,4);
  if(!st.plAno||!ys.includes(st.plAno))st.plAno=String(cy+1);
  $("pl-ano").innerHTML=ys.map(y=>'<option'+(y===st.plAno?" selected":"")+'>'+y+'</option>').join("");
  const ano=st.plAno,conta=st.plConta;
  const saved=planOf(ano,conta)||{cats:{},linhas:{}};const P=st.plDraft||saved;const cats=P.cats||{},lin=P.linhas||{};
  const fm=fullMonthsOf(conta,ano);const n=fm.length;const R=sumStats(conta,fm);
  const prevM=fullMonthsOf(conta,String(+ano-1));const PR=sumStats(conta,prevM);const pn=prevM.length;
  const despCats=allCats().filter(c=>c.k==="despesa").map(c=>c.n).filter(c=>(+cats[c]>0)||(pn&&PR.cats[c]>0.5)||(R.cats[c]>0.5));
  const totPlanM=despCats.reduce((a,c)=>a+(+cats[c]||0),0);
  const tb=$("t-pl");tb.innerHTML="";
  const chip=(real,planAcc,higherBetter)=>{if(!(planAcc>0))return '<span class="chip na">sem plano</span>';const r=real/planAcc;
    if(higherBetter)return r>=1?'<span class="chip ok">no objetivo</span>':r>=0.9?'<span class="chip wait">perto</span>':'<span class="chip miss">abaixo</span>';
    return r>1.05?'<span class="chip miss">acima do plano</span>':r>0.95?'<span class="chip wait">no limite</span>':'<span class="chip ok">dentro</span>';};
  const row=(label,key,store,real,prevAvg,higherBetter,editable)=>{const pm=+store[key]||0;const planAcc=pm*n;const proj=n?real+(real/n)*(12-n):null;const dev=n?real-planAcc:null;
    const tr=document.createElement("tr");
    tr.innerHTML='<td>'+esc(label)+'</td><td class="r">'+(editable?'<input class="orc-in num" type="number" step="5" min="0" inputmode="decimal" aria-label="Plano mensal de '+esc(label)+'" value="'+(pm>0?pm:"")+'" placeholder="—" '+(st.readonly?"disabled":"")+'>':'<b class="num">'+eur0.format(pm)+'</b>')+'</td>'+
      '<td class="r num">'+(pm?eur0.format(pm*12):"—")+'</td><td class="r num muted">'+(pn?eur0.format(prevAvg):"—")+'</td>'+
      '<td class="r num">'+(n?eur.format(real):"—")+'</td><td class="r num">'+(n&&pm?eur.format(planAcc):"—")+'</td>'+
      '<td class="r num '+(dev==null||!pm?"":cls(higherBetter?dev:-dev))+'">'+(dev==null||!pm?"—":signed(dev))+'</td>'+
      '<td class="r num">'+(proj==null?"—":eur0.format(proj))+(proj!=null&&pm?'<div class="note '+cls(higherBetter?proj-pm*12:pm*12-proj)+'">'+(proj-pm*12>=0?"+":"−")+eur0.format(Math.abs(proj-pm*12))+' vs plano</div>':'')+'</td>'+
      '<td>'+(n?chip(real,planAcc,higherBetter):'<span class="chip na">'+(+ano>cy?"ainda não começou":"sem extratos")+'</span>')+'</td>';
    tb.appendChild(tr);
    const inp=tr.querySelector("input");if(inp)inp.addEventListener("input",e=>{st.plDraft=st.plDraft||JSON.parse(JSON.stringify(saved));const tgt=store===cats?(st.plDraft.cats=st.plDraft.cats||{}):(st.plDraft.linhas=st.plDraft.linhas||{});
      const v=parseFloat(e.target.value);if(isFinite(v)&&v>0)tgt[key]=v;else delete tgt[key];$("pl-msg").textContent="Alterações por guardar.";});
  };
  const sep=t=>{const tr=document.createElement("tr");tr.className="pl-sep";tr.innerHTML='<td colspan="9">'+t+'</td>';tb.appendChild(tr);};
  sep("Despesas");
  for(const c of despCats)row(c,c,cats,R.cats[c]||0,pn?(PR.cats[c]||0)/pn:0,false,true);
  row("Total de despesas","_t",{_t:totPlanM},R.despesas,pn?PR.despesas/pn:0,false,false);
  sep("Entradas, poupança e investimento");
  row("Entradas","entradas",lin,R.entradas,pn?PR.entradas/pn:0,true,true);
  row("Poupança","poupanca",lin,R.poupado,pn?PR.poupado/pn:0,true,true);
  row("Investimento","investimento",lin,R.investido,pn?PR.investido/pn:0,true,true);
  if(!st.readonly){const missing=allCats().filter(c=>c.k==="despesa"&&!despCats.includes(c.n));
    if(missing.length){const tr=document.createElement("tr");tr.innerHTML='<td colspan="9"><select aria-label="Adicionar categoria ao plano" style="width:auto"><option value="">+ Adicionar categoria…</option>'+missing.map(c=>'<option>'+esc(c.n)+'</option>').join("")+'</select></td>';
      const anchor=[...tb.querySelectorAll("tr.pl-sep")][1];tb.insertBefore(tr,anchor.previousElementSibling);
      tr.querySelector("select").addEventListener("change",e=>{if(!e.target.value)return;st.plDraft=st.plDraft||JSON.parse(JSON.stringify(saved));st.plDraft.cats=st.plDraft.cats||{};st.plDraft.cats[e.target.value]=50;$("pl-msg").textContent="Alterações por guardar.";renderPlano();});}}
  // summary
  const set=(id,v,sub,c)=>{$(id).textContent=v;$(id).className="big "+(c||"");$(id+"-sub").textContent=sub||" ";};
  set("pl-desp",totPlanM?eur0.format(totPlanM*12):"—",totPlanM?eur0.format(totPlanM)+" por mês":"Preenche o plano abaixo");
  const planAcc=totPlanM*n;
  set("pl-ytd",n?signed(R.despesas-planAcc):"—",n?eur0.format(R.despesas)+" gastos vs "+eur0.format(planAcc)+" planeados ("+n+" meses)":(+ano>cy?"o ano ainda não começou":"sem meses completos"),n&&totPlanM?cls(planAcc-R.despesas):"");
  const proj=n?R.despesas+(R.despesas/n)*(12-n):null;
  set("pl-proj",proj==null?"—":eur0.format(proj),proj!=null&&totPlanM?(proj<=totPlanM*12?"dentro do plano por ":"acima do plano por ")+eur0.format(Math.abs(totPlanM*12-proj)):"de despesas no ano",proj!=null&&totPlanM?cls(totPlanM*12-proj):"");
  const pp=+lin.poupanca||0;
  set("pl-poup",pp?eur0.format(pp*12):"—",pp?(n?eur0.format(R.poupado)+" poupados de "+eur0.format(pp*n)+" previstos":eur0.format(pp)+" por mês"):"Define a linha Poupança",pp&&n?cls(R.poupado-pp*n):"");
  $("pl-note").textContent=planOf(ano,conta)?"Plano guardado"+(st.plDraft?" · alterações por guardar":""):(st.plDraft?"Plano por guardar":"Ainda sem orçamento para "+ano);
  // chart cumulative
  const W=640,Hh=210,pl=52,pb=26,pt=12;const months=[...Array(12)].map((_,i)=>ano+"-"+String(i+1).padStart(2,"0"));
  const realPts=[];let acc=0;for(const m of months){const s=statsFor(conta,m);if(!s)continue;acc+=s.despesas;realPts.push({i:+m.slice(5)-1,v:acc,m});}
  const vmax=Math.max(1,totPlanM*12,acc);const step=niceStep(vmax);const top=Math.ceil(vmax/step)*step;const y=v=>pt+(Hh-pt-pb)*(1-v/top);const x=i=>pl+(W-pl-16)*(i/11);
  let s='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Despesas acumuladas face ao plano">';
  for(let v=0;v<=top+0.001;v+=step)s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+Math.round(v)+'</text>';
  for(let i=0;i<12;i++)s+='<text x="'+x(i)+'" y="'+(Hh-8)+'" text-anchor="middle">'+MES[i].slice(0,3)+'</text>';
  if(totPlanM){let d="";for(let i=0;i<12;i++)d+=(i?"L":"M")+x(i).toFixed(1)+" "+y(totPlanM*(i+1)).toFixed(1);s+='<path d="'+d+'" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>';}
  if(realPts.length){s+='<path d="'+realPts.map((p,k)=>(k?"L":"M")+x(p.i).toFixed(1)+" "+y(p.v).toFixed(1)).join("")+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
    realPts.forEach((p,k)=>{s+='<circle cx="'+x(p.i).toFixed(1)+'" cy="'+y(p.v).toFixed(1)+'" r="'+(k===realPts.length-1?4.5:3)+'" fill="var(--accent)"'+(isPartial(p.m)?' opacity=".5"':'')+'><title>'+mesLabel(p.m)+': '+eur.format(p.v)+'</title></circle>';});}
  s+='</svg>';
  $("pl-chart").innerHTML=s+(!realPts.length?'<p class="note">'+(+ano>cy?"A linha real aparece quando importares os extratos de "+ano+". ":"")+(totPlanM?"":"Preenche o plano para ver a linha planeada.")+'</p>':'');
}
$("pl-conta").addEventListener("click",e=>{const b=e.target.closest("button[data-c]");if(!b)return;st.plConta=b.dataset.c;st.plDraft=null;$("pl-msg").textContent="";
  for(const x of $("pl-conta").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));renderPlano();});
$("pl-ano").addEventListener("change",e=>{st.plAno=e.target.value;st.plDraft=null;$("pl-msg").textContent="";renderPlano();});
$("pl-fill").addEventListener("click",()=>{const conta=st.plConta,ano=st.plAno;const prevM=fullMonthsOf(conta,String(+ano-1));
  if(!prevM.length){$("pl-msg").textContent="Não há meses completos de "+(+ano-1)+" para calcular a média.";return;}
  const PR=sumStats(conta,prevM);const n=prevM.length;const r5=v=>Math.max(0,Math.round(v/n/5)*5);
  const d={cats:{},linhas:{}};for(const c in PR.cats){const v=r5(PR.cats[c]);if(v>0)d.cats[c]=v;}
  for(const [k,v] of [["entradas",PR.entradas],["poupanca",PR.poupado],["investimento",PR.investido]]){const x=r5(v);if(x>0)d.linhas[k]=x;}
  st.plDraft=d;$("pl-msg").textContent="Preenchido com a média de "+n+" meses de "+(+ano-1)+", arredondada a 5 €. Ajusta o que quiseres mudar e guarda.";renderPlano();});
$("pl-save").addEventListener("click",async()=>{if(!st.db)return;const ano=st.plAno,conta=st.plConta;const d=st.plDraft||planOf(ano,conta)||{cats:{},linhas:{}};
  const doc={...(st.planos[ano]||{}),[conta]:{cats:d.cats||{},linhas:d.linhas||{}}};
  try{await st.db.collection("planos").doc(ano).set(doc);st.plDraft=null;$("pl-msg").textContent="Orçamento de "+ano+" guardado.";}catch(e){$("pl-msg").textContent="Não foi possível guardar o plano.";}});

