/* ================= MODO TELEMÓVEL (consulta) ================= */
const MQ=window.matchMedia("(max-width:760px)");
st.m={tab:"resumo",scope:"pessoal",mes:null,open:null};
function fullPref(){try{return localStorage.getItem("mf-full")==="1";}catch(e){return false;}}
function setFullPref(v){try{localStorage.setItem("mf-full",v?"1":"0");}catch(e){}applyMode();window.scrollTo(0,0);}
function applyMode(){const ph=MQ.matches,m=ph&&!fullPref();document.body.classList.toggle("phone",ph);document.body.classList.toggle("m-mode",m);if(m)renderMobile();}
if(MQ.addEventListener)MQ.addEventListener("change",applyMode);else MQ.addListener(applyMode);
let mPend=false;function scheduleM(){if(mPend||!document.body.classList.contains("m-mode"))return;mPend=true;requestAnimationFrame(()=>{mPend=false;renderMobile();});}
{const a=renderFin;renderFin=function(){a.apply(this,arguments);scheduleM();};}
{const a=renderOrc;renderOrc=function(){a.apply(this,arguments);scheduleM();};}
{const a=renderPoup;renderPoup=function(){a.apply(this,arguments);scheduleM();};}
{const a=renderInv;renderInv=function(){a.apply(this,arguments);scheduleM();};}
{const a=renderRent;renderRent=function(){a.apply(this,arguments);scheduleM();};}

function scopeStats(scope,m){
  if(scope!=="ambas"){const s=statsFor(scope,m);return s?{...s,src:[scope]}:null;}
  const a=statsFor("pessoal",m),b=statsFor("conjunta",m);if(!a&&!b)return null;
  const cats={};for(const [s,isP] of [[a,true],[b,false]])if(s)for(const c in s.cats){if(isP&&c==="Casa (conta conjunta)")continue;cats[c]=(cats[c]||0)+s.cats[c];}
  return {...savingsFor("ambas",m),cats,src:[a&&"pessoal",b&&"conjunta"].filter(Boolean)};
}
function scopeBudget(scope,ano){if(scope!=="ambas")return budgetFor(scope,ano);const a=budgetFor("pessoal",ano),b=budgetFor("conjunta",ano),o={};
  for(const c in a){if(c==="Casa (conta conjunta)")continue;o[c]=(o[c]||0)+(+a[c]||0);}for(const c in b)o[c]=(o[c]||0)+(+b[c]||0);return o;}
function mMonths(){return scopeMonths(st.m.scope);}
const ICONS={resumo:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',orcamento:'<path d="M5 20V10M12 20V4M19 20v-7"/>',poupanca:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4"/>',investimentos:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',mais:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'};
const TABS=[["resumo","Resumo"],["orcamento","Orçamento"],["poupanca","Poupança"],["investimentos","Investimentos"],["mais","Mais"]];
function mBar(v,max,col){return '<span class="m-bar"><span style="width:'+(max>0?Math.min(100,Math.max(0,v/max*100)):0).toFixed(1)+'%;background:'+col+'"></span></span>';}
function stateCol(r){return r==null?"var(--accent)":r>1?"var(--neg)":r>0.85?"var(--warn)":"var(--pos)";}
function scopePills(withBoth){const o=[["pessoal","Pessoal"],["conjunta","Conjunta"]];if(withBoth)o.push(["ambas","As duas"]);
  return '<div class="pills m-scope">'+o.map(([k,l])=>'<button type="button" data-sc="'+k+'" aria-pressed="'+(st.m.scope===k)+'">'+l+'</button>').join("")+'</div>';}
function monthNav(ms){const i=ms.indexOf(st.m.mes);return '<div class="m-month"><button type="button" class="m-nav" data-mv="-1" aria-label="Mês anterior" '+(i<=0?"disabled":"")+'>‹</button><span>'+(st.m.mes?mesLabel(st.m.mes)+(isPartial(st.m.mes)?" · em curso":""):"Sem extratos")+'</span><button type="button" class="m-nav" data-mv="1" aria-label="Mês seguinte" '+(i<0||i>=ms.length-1?"disabled":"")+'>›</button></div>';}
function tinyBars(rows,goal){if(!rows.length)return "";const W=340,H=130,pl=4,pb=18,pt=14;const vmax=Math.max(1,goal||0,...rows.map(r=>r.v));const y=v=>pt+(H-pt-pb)*(1-v/vmax);const gw=(W-pl*2)/rows.length,bw=Math.min(22,gw*0.6);
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="m-chart" role="img">';rows.forEach((r,i)=>{const cx=pl+gw*i+gw/2,v=Math.max(0,r.v);
    s+='<rect x="'+(cx-bw/2).toFixed(1)+'" y="'+y(v).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(y(0)-y(v)).toFixed(1)+'" rx="3" fill="'+(r.hl?"var(--accent)":"var(--c-out)")+'"><title>'+r.t+'</title></rect><text x="'+cx+'" y="'+(H-4)+'" text-anchor="middle">'+r.l+'</text>';});
  if(goal)s+='<line x1="0" x2="'+W+'" y1="'+y(goal)+'" y2="'+y(goal)+'" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="5 4"/>';return s+'</svg>';}
function mIdx(m){return +m.slice(0,4)*12+(+m.slice(5)-1);}
function mLbl(m,yr){return MES[+m.slice(5)-1].slice(0,3)+(yr?" "+m.slice(2,4):"");}
function mPeriodFilter(pts){const per=st.m.per||"tudo";if(per==="tudo"||!pts.length)return pts;const last=mIdx(pts[pts.length-1].m);const n=per==="6m"?6:12;
  const f=pts.filter(p=>mIdx(p.m)>=last-n);return f.length>=2?f:pts.slice(-2);}
function periodChips(){const o=[["6m","6M"],["1a","1A"],["tudo","Tudo"]];const per=st.m.per||"tudo";return '<div class="pills m-per">'+o.map(([k,l])=>'<button type="button" data-per="'+k+'" aria-pressed="'+(per===k)+'">'+l+'</button>').join("")+'</div>';}
function tinyLines(pts){pts=mPeriodFilter(pts);if(pts.length<2)return "";const W=340,H=130,pt=10,pb=18;const all=pts.flatMap(p=>[p.v,p.a]);const lo=Math.min(...all)*0.95,hi=Math.max(...all)*1.02;const y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo||1));
  const i0=mIdx(pts[0].m),i1=mIdx(pts[pts.length-1].m),span=Math.max(1,i1-i0);const x=p=>6+(W-12)*(mIdx(p.m)-i0)/span;
  const path=k=>pts.map((p,i)=>(i?"L":"M")+x(p).toFixed(1)+" "+y(p[k]).toFixed(1)).join("");
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="m-chart" role="img"><path d="'+path("v")+'L'+x(pts[pts.length-1])+" "+(H-pb)+"L"+x(pts[0])+" "+(H-pb)+'Z" fill="var(--accent-soft)"/><path d="'+path("a")+'" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 4"/><path d="'+path("v")+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
  const yr=pts[0].m.slice(0,4)!==pts[pts.length-1].m.slice(0,4)||span>11;const nT=Math.min(5,span+1);const ticks=[];
  for(let k=0;k<nT;k++){const idx=Math.round(i0+span*k/(nT-1||1));const m=Math.floor(idx/12)+"-"+String(idx%12+1).padStart(2,"0");if(!ticks.includes(m))ticks.push(m);}
  ticks.forEach((m,k)=>{const xx=6+(W-12)*(mIdx(m)-i0)/span;s+='<text x="'+xx.toFixed(1)+'" y="'+(H-4)+'" text-anchor="'+(k===0?"start":k===ticks.length-1?"end":"middle")+'">'+mLbl(m,yr)+'</text>';});
  return s+'</svg>';}
function mGroupSeries(id){const ser=histGroups()[id]||{};const ms=Object.keys(ser).sort().filter(m=>ser[m].v!=null);const pts=[];let base=null,acc=0,last=null;
  for(const m of Object.keys(ser).sort()){if(last!==null)acc+=+ser[m].a||0;if(ser[m].v==null)continue;if(base===null)base=ser[m].v;pts.push({m,v:ser[m].v,a:base+acc});last=m;}return pts;}
function mInvestSeries(){const H=histGroups();const ids=GROUPS.map(g=>g[0]).filter(id=>H[id]);
  const allM=[...new Set(ids.flatMap(id=>Object.keys(H[id]).filter(m=>H[id][m].v!=null)))].sort();const pts=[];const lastV={},started={};let accA=0;
  for(const m of allM){for(const id of ids){const e=H[id][m];if(!e)continue;
      if(!started[id]){if(e.v!=null){started[id]=true;accA+=e.v;lastV[id]=e.v;}continue;}
      accA+=+e.a||0;if(e.v!=null)lastV[id]=e.v;}
    let v=0;for(const id in lastV)v+=lastV[id];pts.push({m,v:r2(v),a:r2(accA)});}
  // o último ponto é sempre o valor atual de toda a carteira (igual ao "Valor atual" dos Investimentos)
  try{const tot=r2(compute().reduce((x,y)=>x+y.val,0));const cm=curMonth();const lp=pts[pts.length-1];
    if(tot>0){if(lp&&lp.m===cm)lp.v=tot;else if(lp)pts.push({m:cm,v:tot,a:lp.a});else pts.push({m:cm,v:tot,a:tot});}}catch(e){}
  return pts;}

function renderMobile(){
  const el=$("m-content");if(!el)return;const tab=st.m.tab;
  for(const b of document.querySelectorAll("#m-tabs button"))b.setAttribute("aria-current",b.dataset.t===tab?"page":"false");
  const ms=mMonths();if(!st.m.mes||!ms.includes(st.m.mes)){const f=ms.filter(m=>!isPartial(m));st.m.mes=f[f.length-1]||ms[ms.length-1]||null;}
  const m=st.m.mes,ano=(m||curMonth()).slice(0,4);let h="";
  if(tab==="resumo"||tab==="orcamento"){
    {const si=syncInfo();if(si&&si.alerta&&tab==="resumo")h+='<div class="m-card" style="border-color:var(--neg)"><p class="note neg">'+esc(si.txt)+'</p></div>';}
    h+=scopePills(true)+monthNav(ms);
    const s=m?scopeStats(st.m.scope,m):null;const bud=scopeBudget(st.m.scope,ano);const totB=Object.values(bud).reduce((a,b)=>a+(+b||0),0);
    if(!s){h+='<div class="m-card"><p class="note">Ainda não há extratos para esta conta. Importa-os na versão completa, no Mac.</p></div>';}
    else if(tab==="resumo"){
      const gB=Object.keys(bud).reduce((a,c)=>a+(s.cats[c]||0),0);const dim=new Date(+m.slice(0,4),+m.slice(5),0).getDate();
      const lastDay=Math.max(1,...s.src.flatMap(c=>(docFor(c,m)?docFor(c,m).movimentos:[]).map(r=>+r.data.slice(8,10))));
      const proj=isPartial(m)?s.despesas/lastDay*dim:null;const ratio=totB?gB/totB:null;
      h+='<div class="m-card m-hero"><div class="eyebrow">Despesas do mês</div><div class="m-big">'+eur.format(s.despesas)+'</div>';
      if(totB){h+='<div class="m-sub">'+eur0.format(gB)+' de '+eur0.format(totB)+' orçamentados</div>'+mBar(gB,totB,stateCol(ratio))+'<div class="m-sub '+cls(totB-gB)+'">'+(gB<=totB?"Ainda podes gastar "+eur0.format(totB-gB):"Excedeste o orçamento em "+eur0.format(gB-totB))+'</div>';}
      else h+='<div class="m-sub">Sem orçamento definido para '+ano+'. Define-o no Mac, em Orçamento → Ano.</div>';
      if(proj!=null)h+='<div class="m-sub">Ao ritmo atual terminas o mês com cerca de <b>'+eur0.format(proj)+'</b>'+(totB?' ('+(proj<=totB?"dentro":"acima")+' do orçamento)':'')+'.</div>';
      h+='</div>';
      const alerts=Object.keys(bud).filter(c=>+bud[c]>0).map(c=>({c,b:+bud[c],g:s.cats[c]||0})).filter(x=>x.g/x.b>0.85).sort((a,b)=>b.g/b.b-a.g/a.b);
      if(alerts.length)h+='<div class="m-card"><div class="eyebrow">Atenção</div>'+alerts.map(a=>'<button type="button" class="m-row" data-gocat="'+esc(a.c)+'"><span>'+esc(a.c)+'</span><span class="chip '+(a.g>a.b?"miss":"wait")+'">'+(a.g>a.b?"+"+eur0.format(a.g-a.b):Math.round(a.g/a.b*100)+"%")+'</span></button>').join("")+'</div>';
      const g=goalFor(st.m.scope);const rate=s.entradas>0?s.poupado/s.entradas:null;
      h+='<div class="m-grid"><div class="m-card"><div class="eyebrow">Poupança</div><div class="m-mid">'+eur0.format(s.poupado)+'</div><div class="m-sub">'+(g.mensal?"objetivo "+eur0.format(g.mensal):"taxa "+pctOrDash(rate))+'</div>'+(g.mensal?mBar(s.poupado,g.mensal,s.poupado>=g.mensal?"var(--pos)":"var(--warn)"):"")+'</div>'+
        '<div class="m-card"><div class="eyebrow">Entradas</div><div class="m-mid">'+eur0.format(s.entradas)+'</div><div class="m-sub">investido '+eur0.format(s.investido)+'</div></div></div>';
      h+=cofresMobile();
      const pts=mInvestSeries();const lp=pts[pts.length-1],pp=pts[pts.length-2];const dv=lp&&pp?(lp.v-pp.v)-(lp.a-pp.a):null;
      h+='<button type="button" class="m-card m-link" data-tab="investimentos"><div class="eyebrow">Investimentos</div><div class="m-mid">'+esc($("s-valor").textContent)+'</div><div class="m-sub '+(dv==null?"":cls(dv))+'">'+(dv==null?"":(dv>=0?"+":"−")+eur0.format(Math.abs(dv))+" no último mês, sem contar aportes")+'</div></button>';
      const top=Object.entries(s.cats).filter(([,v])=>v>0.5).sort((a,b)=>b[1]-a[1]).slice(0,5);
      if(top.length)h+='<div class="m-card"><div class="eyebrow">Onde foi o dinheiro</div>'+top.map(([c,v])=>{const b=+bud[c]||0;return '<button type="button" class="m-row m-cat" data-gocat="'+esc(c)+'"><span class="m-cn">'+esc(c)+'</span><span class="num">'+eur0.format(v)+(b?' <span class="muted">/ '+eur0.format(b)+'</span>':'')+'</span>'+mBar(v,b||top[0][1],b?stateCol(v/b):"var(--c-out)")+'</button>';}).join("")+'</div>';
    } else {
      const cats=[...new Set([...Object.keys(bud).filter(c=>+bud[c]>0),...Object.keys(s.cats).filter(c=>s.cats[c]>0.5)])].sort((a,b)=>(s.cats[b]||0)-(s.cats[a]||0));
      const gT=cats.reduce((a,c)=>a+(s.cats[c]||0),0);
      h+='<div class="m-card"><div class="m-split"><div><div class="eyebrow">Gasto</div><div class="m-mid">'+eur0.format(gT)+'</div></div><div><div class="eyebrow">Orçamento</div><div class="m-mid">'+(totB?eur0.format(totB):"—")+'</div></div><div><div class="eyebrow">Restante</div><div class="m-mid '+(totB?cls(totB-gT):"")+'">'+(totB?eur0.format(totB-gT):"—")+'</div></div></div></div>';
      h+='<div class="m-card m-list">';
      for(const c of cats){const b=+bud[c]||0,g=s.cats[c]||0,open=st.m.open===c;
        h+='<button type="button" class="m-row m-cat" data-open="'+esc(c)+'" aria-expanded="'+open+'"><span class="m-cn">'+esc(c)+'</span><span class="num">'+eur0.format(g)+(b?' <span class="muted">/ '+eur0.format(b)+'</span>':'')+'</span>'+mBar(g,b||Math.max(g,1),b?stateCol(g/b):"var(--c-out)")+'</button>';
        if(open){const rows=s.src.flatMap(cn=>((docFor(cn,m)||{}).movimentos||[]).filter(r=>r.categoria===c).map(r=>({...r,_c:cn}))).sort((a,b)=>a.valor-b.valor);
          h+='<div class="m-movs">'+rows.map(r=>'<div class="m-mov'+(r.excluido?" excl":"")+'"><div class="m-mt"><span>'+esc(r.descricao.slice(0,38))+'</span><span class="num">'+signed(r.valor)+'</span></div><div class="m-ma"><span class="muted">'+fmtDs(r.data)+(st.m.scope==="ambas"?" · "+CONTA_LABEL[r._c]:"")+'</span><select data-rc="'+r._c+'|'+r.id+'" aria-label="Categoria">'+catOptions(r.categoria)+'</select><button type="button" class="btn-link" data-rx="'+r._c+'|'+r.id+'">'+(r.excluido?"Incluir":"Excluir")+'</button></div></div>').join("")+'</div>';}}
      h+='</div><p class="note m-pad">Toca numa categoria para ver e corrigir os movimentos.</p>';
    }
  } else if(tab==="poupanca"){
    h+=scopePills(true);const year=curMonth().slice(0,4);const rows=scopeMonths(st.m.scope).filter(x=>x.slice(0,4)===year).map(x=>({m:x,...savingsFor(st.m.scope,x)}));
    const g=goalFor(st.m.scope);const ytd=rows.reduce((a,r)=>a+r.poupado,0),ent=rows.reduce((a,r)=>a+r.entradas,0);
    const now=new Date();const el2=now.getMonth()+now.getDate()/new Date(now.getFullYear(),now.getMonth()+1,0).getDate();const exp=g.anual?g.anual*el2/12:null;
    h+='<div class="m-card m-hero"><div class="eyebrow">Poupado em '+year+'</div><div class="m-big">'+eur.format(ytd)+'</div><div class="m-sub">Taxa de poupança '+(ent>0?pct.format(ytd/ent):"—")+(g.taxa?" · objetivo "+g.taxa+"%":"")+'</div>';
    if(g.anual)h+=mBar(ytd,g.anual,ytd>=(exp||0)?"var(--pos)":"var(--warn)")+'<div class="m-sub">'+eur0.format(ytd)+' de '+eur0.format(g.anual)+' · '+(ytd>=exp?"à frente":"atrás")+' do esperado por '+eur0.format(Math.abs(ytd-exp))+'</div>';
    else h+='<div class="m-sub">Define um objetivo anual na versão completa para acompanhares o ritmo.</div>';
    h+='</div><div class="m-card"><div class="eyebrow">Por mês</div>'+tinyBars(rows.map((r,i)=>({l:MES[+r.m.slice(5)-1].slice(0,3),v:r.poupado,hl:i===rows.length-1,t:mesLabel(r.m)+": "+eur.format(r.poupado)})),g.mensal)+'</div>';
    h+='<div class="m-card m-list">'+rows.slice().reverse().map(r=>'<div class="m-row"><span>'+mesLabel(r.m)+'</span><span class="num">'+eur0.format(r.poupado)+' <span class="muted">'+(r.entradas>0?pct.format(r.poupado/r.entradas):"")+'</span></span></div>').join("")+'</div>';
  } else if(tab==="investimentos"){
    const H=histGroups();const selG=st.m.inv&&GROUPS.find(g=>g[0]===st.m.inv&&H[g[0]])?GROUPS.find(g=>g[0]===st.m.inv):null;
    if(selG){const ser=H[selG[0]];const ms2=Object.keys(ser).sort();const R=seriesReturns(ser);const lastM=ms2.filter(m=>ser[m].v!=null).pop();const v=lastM?ser[lastM].v:0;
      const cat=selG[2],tk=selG[3];const lots=st.lotes.filter(l=>l.categoria===cat&&(!tk||l.ticker===tk));const inv=lots.reduce((a,l)=>a+(+l.investido||0),0);
      const AKs=Object.values(st.ativos).filter(a=>(a.categoria||"Cripto")===cat&&(!tk||a.ticker===tk));const cur=AKs.length?AKs.reduce((a,x)=>a+(+x.valorAtual||0),0):v;
      const pts=mGroupSeries(selG[0]);
      h+='<div class="m-card m-hero"><div class="eyebrow"><i class="m-dot" style="background:'+INV_COLOR[cat]+'"></i>'+esc(selG[1])+'</div><div class="m-big">'+eur.format(cur)+'</div><div class="m-sub">'+(()=>{const ds=lots.map(l=>l.data).filter(Boolean).sort();return ds.length?"Desde "+mLbl(ds[0].slice(0,7),true)+" · ":"";})()+'Investido '+eur.format(inv)+' · resultado <span class="'+cls(cur-inv)+'">'+signed(cur-inv)+'</span> · '+pctOrDash(R.acum)+' no ano</div>'+
        (pts.length>1?periodChips()+tinyLines(pts)+'<div class="m-sub">'+mLbl(mPeriodFilter(pts)[0].m,true)+' a '+mLbl(pts[pts.length-1].m,true)+' · '+mPeriodFilter(pts).length+' fechos mensais</div>':'<p class="note">Ainda há poucos fechos mensais para desenhar a evolução deste investimento.</p>')+'<div class="m-sub"><span class="m-key" style="background:var(--accent)"></span>valor <span class="m-key dash"></span>total aportado · toca outra vez para ver o total</div></div>';}
    else h+='<div class="m-card m-hero"><div class="eyebrow">Carteira</div><div class="m-big">'+esc($("s-valor").textContent)+'</div><div class="m-sub">Investido '+esc($("s-inv").textContent)+' · resultado <span class="'+($("s-res").className.includes("neg")?"neg":"pos")+'">'+esc($("s-res").textContent)+'</span></div>'+(()=>{const P=mInvestSeries();return P.length>1?periodChips()+tinyLines(P)+'<div class="m-sub">'+mLbl(mPeriodFilter(P)[0].m,true)+' a '+mLbl(P[P.length-1].m,true)+'</div>':"";})()+'<div class="m-sub"><span class="m-key" style="background:var(--accent)"></span>valor <span class="m-key dash"></span>total aportado · toca num investimento para o ver sozinho</div></div>';
    h+='<div class="m-card m-list">';
    for(const [id,nome,cat] of GROUPS){const ser=H[id];if(!ser)continue;const ms2=Object.keys(ser).sort();const R=seriesReturns(ser);const lastM=ms2.filter(m=>ser[m].v!=null).pop();const last=lastM?ser[lastM]:{v:0};
      const lf=ms2.filter(x=>R.mensal[x]&&R.mensal[x].r!=null&&!R.mensal[x].gap&&!ser[x].parcial).pop();const on=st.m.inv===id;
      h+='<button type="button" class="m-row m-inv'+(on?' on':'')+'" data-inv="'+esc(id)+'" aria-pressed="'+on+'"><span><i class="m-dot" style="background:'+INV_COLOR[cat]+'"></i>'+esc(nome)+'</span><span class="num">'+eur0.format(last.v||0)+'</span><span class="m-sub2"><span class="'+cls(R.acum||0)+'">'+pctOrDash(R.acum)+' no ano</span>'+(lf?' · <span class="'+cls(R.mensal[lf].r)+'">'+(R.mensal[lf].r>0?"+":"")+pct.format(R.mensal[lf].r)+' em '+MES[+lf.slice(5)-1].slice(0,3)+'</span>':' · <span class="muted">sem fechos mensais suficientes</span>')+'</span></button>';}
    h+='</div><div class="m-card"><div class="eyebrow">Cripto e isenção de 365 dias</div><div class="m-split"><div><div class="m-sub">Já isento</div><div class="m-mid pos">'+esc($("x-isento").textContent)+'</div></div><div><div class="m-sub">Próxima isenção</div><div class="m-mid">'+esc($("x-prox").textContent)+'</div><div class="m-sub">'+esc($("x-prox-sub").textContent)+'</div></div></div></div>';
  } else {
    h+='<div class="m-card"><div class="eyebrow">Conta</div><div class="m-row"><span>'+esc(($("who")||{}).textContent||"")+'</span><button type="button" class="btn-link" data-act="sair">Sair</button></div></div>'+
      '<div class="m-card"><div class="eyebrow">Versão completa</div><p class="note">Tabelas, importação de extratos, regras, categorias, plano anual e rentabilidade detalhada. Fica mais confortável no Mac.</p><button type="button" class="btn" data-act="full">Abrir versão completa</button></div>'+
      '<div class="m-card"><div class="eyebrow">Cópia de segurança</div><button type="button" class="btn-ghost" data-act="bk">Descarregar cópia</button><p class="note" id="m-bk"></p></div>'+
      (syncInfo()?'<div class="m-card"><div class="eyebrow">Sincronização com o banco</div><p class="note'+(syncInfo().alerta?' neg':'')+'">'+esc(syncInfo().txt)+'</p>'+(syncInfo().alerta?'<p class="note">Para renovar, pede ao Claude ou corre "1 · Autorizar Revolut" no repositório myfinance-sync.</p>':'')+'</div>':'')+
      '<p class="note m-pad">'+esc($("status").textContent)+'</p>';
  }
  el.innerHTML=h;
}
document.addEventListener("click",async e=>{const root=e.target.closest("#m-app");if(!root)return;
  const t=e.target.closest("[data-t]");if(t){st.m.tab=t.dataset.t;st.m.open=null;renderMobile();window.scrollTo(0,0);return;}
  const pr=e.target.closest("[data-per]");if(pr){st.m.per=pr.dataset.per;renderMobile();return;}
  const iv=e.target.closest("[data-inv]");if(iv){st.m.inv=st.m.inv===iv.dataset.inv?null:iv.dataset.inv;renderMobile();const c=document.querySelector("#m-content .m-hero");if(c)c.scrollIntoView({behavior:"smooth",block:"start"});return;}
  const tb=e.target.closest("[data-tab]");if(tb){st.m.tab=tb.dataset.tab;renderMobile();window.scrollTo(0,0);return;}
  const sc=e.target.closest("[data-sc]");if(sc){st.m.scope=sc.dataset.sc;st.m.open=null;renderMobile();return;}
  const mv=e.target.closest("[data-mv]");if(mv){const ms=mMonths();const i=ms.indexOf(st.m.mes)+(+mv.dataset.mv);if(ms[i]){st.m.mes=ms[i];st.m.open=null;renderMobile();}return;}
  const gc=e.target.closest("[data-gocat]");if(gc){st.m.tab="orcamento";st.m.open=gc.dataset.gocat;renderMobile();return;}
  const op=e.target.closest("[data-open]");if(op){st.m.open=st.m.open===op.dataset.open?null:op.dataset.open;renderMobile();return;}
  const rx=e.target.closest("[data-rx]");if(rx){const [c,id]=rx.dataset.rx.split("|");const did=c+"-"+st.m.mes;const doc=st.meses[did];if(!doc)return;rx.disabled=true;
    try{await saveMonth(did,doc.movimentos.map(r=>r.id===id?{...r,excluido:!r.excluido}:r));}catch(err){setStatus("Não foi possível guardar.");}return;}
  const act=e.target.closest("[data-act]");if(act){const a=act.dataset.act;if(a==="full")setFullPref(true);else if(a==="sair")$("logout").click();else if(a==="bk")$("bk-export").click();}
});
document.addEventListener("change",async e=>{const sel=e.target.closest("#m-app select[data-rc]");if(!sel)return;const [c,id]=sel.dataset.rc.split("|");const did=c+"-"+st.m.mes;const doc=st.meses[did];if(!doc)return;
  try{await saveMonth(did,doc.movimentos.map(r=>r.id===id?{...r,categoria:sel.value,manual:true}:r));}catch(err){setStatus("Não foi possível guardar a categoria.");}});
$("m-back").addEventListener("click",()=>setFullPref(false));
applyMode();

