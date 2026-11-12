/* ---------- gráfico de investimentos (versão completa) ---------- */
st.dInv=null;
function bigLines(pts){if(pts.length<2)return "";const W=760,H=270,pl=58,pr=16,pt=14,pb=28;const all=pts.flatMap(p=>[p.v,p.a]);
  let lo=Math.min(...all),hi=Math.max(...all);const step=niceStep(Math.max(1,hi-lo));lo=Math.floor(lo*0.97/step)*step;hi=Math.ceil(hi/step)*step;if(hi===lo)hi=lo+step;
  const y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));const i0=mIdx(pts[0].m),i1=mIdx(pts[pts.length-1].m),span=Math.max(1,i1-i0);const x=p=>pl+(W-pl-pr)*(mIdx(p.m)-i0)/span;
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Evolução do valor face ao total aportado">';
  for(let v=lo;v<=hi+0.001;v+=step)s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" stroke="var(--line)"/><text x="'+(pl-8)+'" y="'+(y(v)+4).toFixed(1)+'" text-anchor="end">'+eur0.format(v).replace(/\s?€/,"")+'</text>';
  const yr=pts[0].m.slice(0,4)!==pts[pts.length-1].m.slice(0,4)||span>11;const nT=Math.min(8,span+1);const ticks=[];
  for(let k=0;k<nT;k++){const idx=Math.round(i0+span*k/(nT-1||1));const m=Math.floor(idx/12)+"-"+String(idx%12+1).padStart(2,"0");if(!ticks.includes(m))ticks.push(m);}
  ticks.forEach((m,k)=>{const xx=pl+(W-pl-pr)*(mIdx(m)-i0)/span;s+='<text x="'+xx.toFixed(1)+'" y="'+(H-8)+'" text-anchor="'+(k===0?"start":k===ticks.length-1?"end":"middle")+'">'+mLbl(m,yr)+'</text>';});
  const path=k=>pts.map((p,i)=>(i?"L":"M")+x(p).toFixed(1)+" "+y(p[k]).toFixed(1)).join("");
  s+='<path d="'+path("v")+'L'+x(pts[pts.length-1]).toFixed(1)+" "+y(lo).toFixed(1)+"L"+x(pts[0]).toFixed(1)+" "+y(lo).toFixed(1)+'Z" fill="var(--accent-soft)" opacity=".8"/>';
  s+='<path d="'+path("a")+'" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/><path d="'+path("v")+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
  pts.forEach((p,i)=>{s+='<circle cx="'+x(p).toFixed(1)+'" cy="'+y(p.v).toFixed(1)+'" r="'+(i===pts.length-1?4.5:3)+'" fill="var(--accent)"><title>'+mesLabel(p.m)+': '+eur.format(p.v)+' · aportado '+eur.format(p.a)+' · '+signed(p.v-p.a)+'</title></circle>';});
  return s+'</svg>';}
function renderDeskInvChart(){
  const el=$("rent-chart");if(!el)return;const H=histGroups();
  const sel=st.dInv&&GROUPS.find(g=>g[0]===st.dInv&&H[g[0]])||null;if(!sel)st.dInv=null;
  const pts=sel?mGroupSeries(sel[0]):mInvestSeries();const f=mPeriodFilter(pts);const per=st.m.per||"tudo";
  const chips='<div class="pills" role="group" aria-label="Período">'+[["6m","6M"],["1a","1A"],["tudo","Tudo"]].map(([k,l])=>'<button type="button" data-dper="'+k+'" aria-pressed="'+(per===k)+'">'+l+'</button>').join("")+'</div>';
  const last=f[f.length-1];
  let h='<div class="block-head" style="margin-top:6px"><div><div class="eyebrow">'+(sel?'<i class="m-dot" style="background:'+INV_COLOR[sel[2]]+'"></i>'+esc(sel[1]):"Carteira total")+'</div>'+
    (last?'<div class="num" style="font-size:1.25rem">'+eur.format(last.v)+' <span class="note '+cls(last.v-last.a)+'">'+signed(last.v-last.a)+' face ao aportado</span></div>':'')+'</div>'+chips+'</div>';
  h+=f.length>1?bigLines(pts)+'<p class="note">'+mLbl(f[0].m,true)+' a '+mLbl(last.m,true)+' · '+f.length+' fechos mensais · '+(sel?'clica outra vez na linha para voltar ao total':'clica numa linha da tabela para ver só esse investimento')+'</p>'+(sel?"":'<p class="note">No total, um mês sem valor registado de um investimento usa o último valor conhecido; a entrada de um investimento novo conta como aporte.</p>'):'<div class="empty">Ainda há poucos fechos mensais para desenhar este gráfico.</div>';
  el.innerHTML=h;
  // linhas da tabela clicáveis
  const ids=GROUPS.filter(g=>H[g[0]]).map(g=>g[0]);const rows=[...document.querySelectorAll("#t-rent tr")];
  rows.forEach((tr,i)=>{const id=ids[i];if(!id)return;tr.dataset.g=id;tr.style.cursor="pointer";tr.classList.toggle("sel",id===st.dInv);tr.title="Ver o gráfico deste investimento";});
}
{const a=renderRent;renderRent=function(){a.apply(this,arguments);renderDeskInvChart();};}
document.addEventListener("click",e=>{const tr=e.target.closest("#t-rent tr[data-g]");if(tr){st.dInv=st.dInv===tr.dataset.g?null:tr.dataset.g;renderDeskInvChart();$("rent-chart").scrollIntoView({behavior:"smooth",block:"nearest"});return;}
  const p=e.target.closest("[data-dper]");if(p){st.m.per=p.dataset.dper;renderDeskInvChart();}});

