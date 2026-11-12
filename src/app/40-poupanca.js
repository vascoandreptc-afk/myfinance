/* ================= POUPANÇA ================= */
st.ppScope="pessoal";st.goals=null;
function savingsFor(scope,m){
  if(scope!=="ambas")return statsFor(scope,m);
  const a=statsFor("pessoal",m),b=statsFor("conjunta",m);if(!a&&!b)return null;
  const z={entradas:0,despesas:0,poupado:0,investido:0,reserva:0,paraConjunta:0,viaConj:0};
  const A=a||z,B=b||z;
  return {entradas:A.entradas+B.entradas-A.paraConjunta-A.viaConj,despesas:A.despesas-A.paraConjunta+B.despesas,poupado:A.poupado-A.viaConj+B.poupado,investido:A.investido+B.investido,reserva:A.reserva+B.reserva};
}
function scopeMonths(scope){if(scope!=="ambas")return monthsOf(scope);return [...new Set([...monthsOf("pessoal"),...monthsOf("conjunta")])].sort();}
function goalFor(scope){const g=(st.goals&&st.goals[scope])||{};const mensal=+g.mensal||0;const anual=+g.anual||(mensal?mensal*12:0);return {mensal:mensal||(anual?anual/12:0),anual,taxa:+g.taxa||0};}
function renderPoup(){
  const scope=st.ppScope;const year=curMonth().slice(0,4);
  const ms=scopeMonths(scope).filter(m=>m.slice(0,4)===year);
  const rows=ms.map(m=>({m,...savingsFor(scope,m)}));
  const g=goalFor(scope);
  const ytd=rows.reduce((a,r)=>a+r.poupado,0),entr=rows.reduce((a,r)=>a+r.entradas,0);
  const full=rows.filter(r=>!isPartial(r.m));const avg=full.length?full.reduce((a,r)=>a+r.poupado,0)/full.length:null;
  const now=new Date();const mi=now.getMonth();const dim=new Date(now.getFullYear(),mi+1,0).getDate();
  const elapsed=mi+(now.getDate()/dim);const expected=g.anual?g.anual*elapsed/12:null;
  const proj=avg!=null?ytd+avg*(12-elapsed):null;
  const set=(id,v,sub,c)=>{$(id).textContent=v;$(id).className="big "+(c||"");$(id+"-sub").textContent=sub||" ";};
  set("p-ytd",eur.format(ytd),rows.length?"de janeiro a "+MES[+rows[rows.length-1].m.slice(5)-1]+(isPartial(rows[rows.length-1].m)?" (em curso)":""):"sem extratos");
  set("p-avg",avg==null?"—":eur.format(avg),full.length+" meses completos");
  set("p-rate",entr>0?pct.format(ytd/entr):"—",g.taxa?"objetivo "+g.taxa+"%":"do que entrou no ano",g.taxa&&entr>0?(ytd/entr*100>=g.taxa?"pos":"neg"):"");
  set("p-goal",g.anual?pct.format(ytd/g.anual):"—",g.anual?eur.format(ytd)+" de "+eur.format(g.anual)+(expected!=null?" · "+(ytd>=expected?"+":"−")+eur0.format(Math.abs(ytd-expected))+" vs esperado":""):"Define o objetivo ao lado",g.anual&&expected!=null?(ytd>=expected?"pos":"neg"):"");
  $("pp-note").textContent=scope==="ambas"?"Soma das duas contas":"";
  $("goal-scope").textContent="Para: "+(scope==="pessoal"?"conta pessoal":scope==="conjunta"?"conta conjunta":"as duas contas juntas");
  const gg=(st.goals&&st.goals[scope])||{};
  if(document.activeElement&&!document.activeElement.closest("#f-goal")){$("g-mensal").value=gg.mensal??"";$("g-anual").value=gg.anual??"";$("g-taxa").value=gg.taxa??"";}
  // bars chart
  const bars=$("pp-bars");
  if(!rows.length){bars.innerHTML='<div class="empty">Importa extratos para ver a poupança mensal.</div>';}
  else{const W=640,H=210,pl=48,pb=26,pt=14;const vmax=Math.max(1,g.mensal||0,...rows.map(r=>r.poupado));
    const step=niceStep(vmax);const top=Math.ceil(vmax/step)*step;const y=v=>pt+(H-pt-pb)*(1-v/top);const gw=(W-pl-8)/rows.length;const bw=Math.min(30,gw*0.55);
    let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Poupança por mês">';
    for(let v=0;v<=top+0.001;v+=step)s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+Math.round(v)+'</text>';
    rows.forEach((r,i)=>{const cx=pl+gw*i+gw/2;const c=Math.max(0,r.poupado);
      s+='<rect x="'+(cx-bw/2).toFixed(1)+'" y="'+y(c).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(y(0)-y(c)).toFixed(1)+'" rx="2" fill="var(--accent)"'+(isPartial(r.m)?' opacity=".5"':'')+'><title>'+mesLabel(r.m)+': '+eur.format(r.poupado)+'</title></rect>';
      if(r.entradas>0&&c>0)s+='<text x="'+cx+'" y="'+(y(c)-4)+'" text-anchor="middle">'+Math.round(r.poupado/r.entradas*100)+'%</text>';
      s+='<text x="'+cx+'" y="'+(H-8)+'" text-anchor="middle">'+mShort(r.m)+'</text>';});
    if(g.mensal)s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+y(g.mensal)+'" y2="'+y(g.mensal)+'" stroke="var(--warn)" stroke-width="2" stroke-dasharray="6 4"/>';
    bars.innerHTML=s+'</svg>';}
  // cumulative chart
  const cum=$("pp-cum");
  if(!rows.length){cum.innerHTML="";$("pp-cum-note").textContent="";}
  else{const W=640,H=210,pl=52,pb=26,pt=14;const pts=[];let acc=0;rows.forEach(r=>{acc+=r.poupado;pts.push({m:r.m,v:acc});});
    const vmax=Math.max(1,acc,g.anual||0);const step=niceStep(vmax);const top=Math.ceil(vmax/step)*step;const y=v=>pt+(H-pt-pb)*(1-v/top);
    const x=i=>pl+(W-pl-16)*(i/11);
    let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Poupança acumulada face ao objetivo">';
    for(let v=0;v<=top+0.001;v+=step)s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+Math.round(v)+'</text>';
    for(let i=0;i<12;i++)s+='<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+MES[i].slice(0,3)+'</text>';
    if(g.anual){let d="";for(let i=0;i<12;i++)d+=(i?"L":"M")+x(i).toFixed(1)+" "+y(g.anual*(i+1)/12).toFixed(1);s+='<path d="'+d+'" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>';}
    let d="";pts.forEach((p,i)=>{const xi=+p.m.slice(5)-1;d+=(i?"L":"M")+x(xi).toFixed(1)+" "+y(p.v).toFixed(1);});
    s+='<path d="'+d+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
    pts.forEach((p,i)=>{const xi=+p.m.slice(5)-1;s+='<circle cx="'+x(xi).toFixed(1)+'" cy="'+y(p.v).toFixed(1)+'" r="'+(i===pts.length-1?4.5:3)+'" fill="var(--accent)"><title>'+mesLabel(p.m)+': '+eur.format(p.v)+'</title></circle>';});
    if(proj!=null){const lp=pts[pts.length-1];s+='<path d="M'+x(+lp.m.slice(5)-1).toFixed(1)+" "+y(lp.v).toFixed(1)+"L"+x(11).toFixed(1)+" "+y(Math.max(0,Math.min(top,proj))).toFixed(1)+'" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="2 4" fill="none"/>';}
    cum.innerHTML=s+'</svg>';
    $("pp-cum-note").textContent=(proj!=null?"Ao ritmo médio dos meses completos ("+eur.format(avg)+"/mês), terminas o ano com cerca de "+eur.format(proj)+".":"")+(g.anual?" Objetivo: "+eur.format(g.anual)+".":" Define um objetivo para veres a linha do esperado.");}
  // table
  const tb=$("t-pp");tb.innerHTML="";
  for(const r of rows.slice().reverse()){const tr=document.createElement("tr");const rate=r.entradas>0?r.poupado/r.entradas:null;
    const vs=g.mensal?r.poupado-g.mensal:null;
    tr.innerHTML='<td>'+mesLabel(r.m)+(isPartial(r.m)?' <span class="chip na">em curso</span>':'')+'</td><td class="r num">'+eur.format(r.entradas)+'</td><td class="r num">'+eur.format(r.despesas)+'</td><td class="r num"><b>'+eur.format(r.poupado)+'</b></td><td class="pct '+(g.taxa&&rate!=null?(rate*100>=g.taxa?"pos":"neg"):"")+'">'+pctOrDash(rate)+'</td><td class="r num muted">'+eur.format(r.investido)+'</td><td class="r num '+(vs==null?"":cls(vs))+'">'+(vs==null?"—":signed(vs))+'</td>';
    tb.appendChild(tr);}
  // pace
  const pace=$("pp-pace");pace.innerHTML="";
  const items=[["Poupado até hoje",ytd],["Esperado até hoje",expected],["Projeção fim do ano",proj],["Objetivo anual",g.anual||null]];
  const pmax=Math.max(1,...items.map(i=>i[1]||0));
  for(const [k,v] of items){const d=document.createElement("div");d.className="catrow";d.style.cursor="default";d.style.gridTemplateColumns="minmax(0,130px) minmax(0,1fr) auto";
    d.innerHTML='<span class="cname">'+k+'</span><span class="track"><span style="width:'+(v?Math.max(2,v/pmax*100):0).toFixed(1)+'%;background:'+(k==="Poupado até hoje"?"var(--accent)":"var(--c-out)")+'"></span></span><span class="amt">'+(v==null?"—":eur0.format(v))+'</span>';pace.appendChild(d);}
}
function niceStep(vmax){const st0=Math.pow(10,Math.floor(Math.log10(vmax)));return [1,2,2.5,5,10].map(f=>f*st0).find(v=>vmax/v<=5)||st0*10;}
$("pp-scope").addEventListener("click",e=>{const b=e.target.closest("button[data-s]");if(!b)return;st.ppScope=b.dataset.s;
  for(const x of $("pp-scope").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));
  const gg=(st.goals&&st.goals[st.ppScope])||{};$("g-mensal").value=gg.mensal??"";$("g-anual").value=gg.anual??"";$("g-taxa").value=gg.taxa??"";renderPoup();});
$("f-goal").addEventListener("submit",async e=>{e.preventDefault();if(!st.db)return;const num=id=>{const v=parseFloat($(id).value);return isFinite(v)&&v>0?v:null;};
  const g={mensal:num("g-mensal"),anual:num("g-anual"),taxa:num("g-taxa")};for(const k in g)if(g[k]==null)delete g[k];
  try{await st.db.collection("config").doc("objetivos").set({...(st.goals||{}),[st.ppScope]:g});$("g-msg").textContent="Objetivos guardados.";}catch(err){$("g-msg").textContent="Não foi possível guardar.";}});

