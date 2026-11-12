/* ================= RENTABILIDADE ================= */
st.hist=null;
const GROUPS=[["BTC","Bitcoin","Cripto","BTC"],["ADA","Cardano","Cripto","ADA"],["ETF Core","Plano Core","ETF Core",null],["ETF Agressivo","Plano Agressivo","ETF Agressivo",null],["XTB Manual","XTB carteira manual","XTB Manual",null]];
function histGroups(){return (st.hist&&st.hist.grupos)||{};}
function dietz(v0,v1,a){const den=v0+a/2;return den>0?(v1-v0-a)/den:null;}
function seriesReturns(ser){
  const ms=Object.keys(ser).sort();const out={};let prevM=null,accA=0,chain=1,any=false,skipped=false;
  for(const m of ms){const p=ser[m];if(prevM!==null)accA+=+p.a||0;
    if(p.v==null){if(prevM!==null)skipped=true;continue;}
    if(prevM!==null){const r=dietz(ser[prevM].v,p.v,accA);out[m]={r,gap:skipped};if(r!=null){chain*=1+r;any=true;}}
    prevM=m;accA=0;skipped=false;}
  return {mensal:out,acum:any?chain-1:null};
}
function renderRent(){
  const H=histGroups();const tb=$("t-rent");tb.innerHTML="";const year=curMonth().slice(0,4);
  if(!Object.keys(H).length){tb.innerHTML='<tr><td colspan="6"><div class="empty">Sem histórico ainda. Regista o fecho do primeiro mês.</div></td></tr>';$("rent-chart").innerHTML="";$("rm-head").innerHTML="";$("t-rm").innerHTML="";return;}
  const allM=[...new Set(Object.values(H).flatMap(s=>Object.keys(s)))].sort();
  let tV=0,tA=0,tG=0,tV0=0;const rets={};
  for(const [id,nome] of GROUPS){const ser=H[id];if(!ser)continue;const ms=Object.keys(ser).sort();
    const R=seriesReturns(ser);rets[id]=R;const first=ser[ms[0]],last=ser[ms[ms.length-1]];
    const aY=ms.slice(1).reduce((a,m)=>a+(+ser[m].a||0),0);const gain=last.v!=null&&first.v!=null?last.v-first.v-aY:null;
    tV+=last.v||0;tA+=aY;tG+=gain||0;tV0+=first.v||0;
    const lastFull=ms.filter(m=>R.mensal[m]&&R.mensal[m].r!=null&&!R.mensal[m].gap&&!ser[m].parcial).pop();
    const tr=document.createElement("tr");
    tr.innerHTML='<td><span class="cat"><i style="background:'+INV_COLOR[GROUPS.find(g=>g[0]===id)[2]]+'"></i></span> '+esc(nome)+'</td><td class="r num">'+eur.format(last.v||0)+'</td><td class="r num">'+eur.format(aY)+'</td>'+
      '<td class="r num '+cls(gain||0)+'">'+(gain==null?"—":signed(gain))+'</td><td class="pct '+cls(R.acum||0)+'">'+pctOrDash(R.acum)+'</td><td class="pct '+(lastFull?cls(R.mensal[lastFull].r):"")+'">'+(lastFull?pctOrDash(R.mensal[lastFull].r)+'<div class="note">'+mShort(lastFull)+'</div>':"—")+'</td>';
    tb.appendChild(tr);}
  // total (Dietz aggregate over groups with consecutive values)
  const tot={};let chain=1;const totSer={};
  for(let i=1;i<allM.length;i++){const m=allM[i],p=allM[i-1];let v0=0,v1=0,a=0,n=0;
    for(const [id] of GROUPS){const s=H[id];if(!s||!s[m]||!s[p]||s[m].v==null||s[p].v==null)continue;v0+=s[p].v;v1+=s[m].v;a+=+s[m].a||0;n++;}
    if(n){const r=dietz(v0,v1,a);tot[m]=r;if(r!=null)chain*=1+r;}}
  const tr=document.createElement("tr");tr.innerHTML='<td><b>Total</b></td><td class="r num"><b>'+eur.format(tV)+'</b></td><td class="r num">'+eur.format(tA)+'</td><td class="r num '+cls(tG)+'"><b>'+signed(tG)+'</b></td><td class="pct '+cls(tG)+'"><b>'+pctOrDash(tV0+tA/2>0?tG/(tV0+tA/2):null)+'</b></td><td></td>';tb.appendChild(tr);
  $("rent-note").textContent="Desde "+mesLabel(allM[0])+" · "+(st.hist.nota?"valores até out. estimados":"");
  // monthly matrix
  const ms=allM.slice(1);
  $("rm-head").innerHTML='<tr><th>Mês</th>'+GROUPS.filter(g=>H[g[0]]).map(g=>'<th class="r">'+esc(g[1])+'</th>').join("")+'<th class="r">Total</th></tr>';
  const tm=$("t-rm");tm.innerHTML="";
  for(const m of ms.slice().reverse()){const tr=document.createElement("tr");let h='<td>'+mesLabel(m)+(H.BTC&&H.BTC[m]&&H.BTC[m].parcial?' <span class="chip na">até hoje</span>':'')+'</td>';
    for(const g of GROUPS){if(!H[g[0]])continue;const r=rets[g[0]].mensal[m];const ok=r&&r.r!=null&&!r.gap;h+='<td class="pct '+(ok?cls(r.r):"")+'"'+(r&&r.gap?' title="Sem valores nos meses anteriores: a variação desde o último valor conta só na acumulada"':'')+'>'+(ok?(r.r>0?"+":"")+pct.format(r.r):'<span class="muted">—</span>')+'</td>';}
    h+='<td class="pct '+(tot[m]!=null?cls(tot[m]):"")+'"><b>'+(tot[m]!=null?(tot[m]>0?"+":"")+pct.format(tot[m]):"—")+'</b></td>';tr.innerHTML=h;tm.appendChild(tr);}
  // chart: total value (groups with value) vs cumulative contributions
  const full=GROUPS.map(g=>g[0]).filter(id=>H[id]&&allM.every(m=>H[id][m]&&H[id][m].v!=null));
  const pts=[];let base=null,accA=0;
  for(const m of allM){let v=0;for(const id of full)v+=H[id][m].v;
    if(base===null)base=v;else{for(const id of full)accA+=+H[id][m].a||0;}
    pts.push({m,v,a:base+accA});}
  const excl=GROUPS.filter(g=>H[g[0]]&&!full.includes(g[0])).map(g=>g[1]);
  const W=640,Hh=200,pl=52,pb=26,pt=12;const vmax=Math.max(...pts.map(p=>Math.max(p.v,p.a)));const vmin=Math.min(...pts.map(p=>Math.min(p.v,p.a)));
  const step=niceStep(Math.max(1,vmax-vmin));const lo=Math.floor(vmin*0.95/step)*step,hi=Math.ceil(vmax/step)*step;const y=v=>pt+(Hh-pt-pb)*(1-(v-lo)/(hi-lo));const x=i=>pl+(W-pl-16)*(i/Math.max(1,pts.length-1));
  let s='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Valor da carteira face ao total aportado">';
  for(let v=lo;v<=hi+0.001;v+=step)s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+Math.round(v)+'</text>';
  pts.forEach((p,i)=>{s+='<text x="'+x(i)+'" y="'+(Hh-8)+'" text-anchor="middle">'+mShort(p.m)+'</text>';});
  const path=k=>pts.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p[k]).toFixed(1)).join("");
  s+='<path d="'+path("v")+'L'+x(pts.length-1).toFixed(1)+" "+y(lo)+"L"+x(0)+" "+y(lo)+'Z" fill="var(--accent-soft)" opacity=".7"/>';
  s+='<path d="'+path("a")+'" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/><path d="'+path("v")+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
  const lp=pts[pts.length-1];s+='<circle cx="'+x(pts.length-1)+'" cy="'+y(lp.v)+'" r="4.5" fill="var(--accent)"><title>'+eur.format(lp.v)+'</title></circle>';
  $("rent-chart").innerHTML=s+'</svg>'+(excl.length?'<p class="note">O gráfico não inclui '+excl.join(", ")+' por falta de valores mensais.</p>':'');
  renderFecho();
}
function renderFecho(){
  const el=$("fe-rows");if(!$("fe-mes").value){const d=new Date();d.setDate(0);$("fe-mes").value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");}
  const m=$("fe-mes").value;const H=histGroups();const AKs=Object.values(st.ativos);
  if(el.dataset.m===m&&el.children.length)return;el.dataset.m=m;el.innerHTML='<div class="fe-row note"><span>Investimento</span><span>Valor fim</span><span>Aportado</span></div>';
  for(const [id,nome,cat,tk] of GROUPS){const ex=H[id]&&H[id][m];
    const cur=AKs.filter(a=>(a.categoria||"Cripto")===cat&&(!tk||a.ticker===tk)).reduce((s,a)=>s+(+a.valorAtual||0),0);
    const apL=st.lotes.filter(l=>l.categoria===cat&&(!tk||l.ticker===tk)&&l.data&&l.data.slice(0,7)===m).reduce((s,l)=>s+(+l.investido||0),0);
    const d=document.createElement("div");d.className="fe-row";
    d.innerHTML='<span>'+esc(nome)+'</span><input type="number" step="0.01" inputmode="decimal" data-g="'+id+'" data-k="v" aria-label="Valor de '+esc(nome)+' no fim do mês" value="'+(ex&&ex.v!=null?ex.v:(cur?cur.toFixed(2):""))+'"><input type="number" step="0.01" inputmode="decimal" data-g="'+id+'" data-k="a" aria-label="Aportado em '+esc(nome)+'" value="'+(ex&&ex.a!=null?ex.a:(apL?apL.toFixed(2):""))+'">';
    el.appendChild(d);}
}
$("fe-mes").addEventListener("change",()=>{$("fe-rows").dataset.m="";renderFecho();});
$("f-fecho").addEventListener("submit",async e=>{e.preventDefault();if(!st.db)return;const m=$("fe-mes").value;if(!m){$("fe-msg").textContent="Escolhe o mês.";return;}
  const g=JSON.parse(JSON.stringify(histGroups()));
  for(const inp of $("fe-rows").querySelectorAll("input")){const id=inp.dataset.g,k=inp.dataset.k;const v=parseFloat(inp.value);
    g[id]=g[id]||{};g[id][m]=g[id][m]||{};if(isFinite(v))g[id][m][k]=r2(v);else delete g[id][m][k];delete g[id][m].est;delete g[id][m].parcial;}
  try{await st.db.collection("historico").doc("carteira").set({...(st.hist||{}),grupos:g});$("fe-msg").textContent="Fecho de "+mesLabel(m)+" guardado.";}catch(err){$("fe-msg").textContent="Não foi possível guardar.";}});

