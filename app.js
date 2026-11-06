// Finance core: categories, default rules, categorisation
const CATS=[
  {n:"Supermercado",k:"despesa"},{n:"Restauração",k:"despesa"},{n:"Casa e serviços",k:"despesa"},{n:"Casa (conta conjunta)",k:"despesa"},
  {n:"Combustível",k:"despesa"},{n:"Transportes",k:"despesa"},{n:"Portagens",k:"despesa"},{n:"Subscrições",k:"despesa"},
  {n:"Compras",k:"despesa"},{n:"Vestuário",k:"despesa"},{n:"Saúde",k:"despesa"},{n:"Lazer e desporto",k:"despesa"},
  {n:"Viagens",k:"despesa"},{n:"Apostas",k:"despesa"},{n:"Transferências a pessoas",k:"despesa"},{n:"Levantamentos",k:"despesa"},{n:"Outros",k:"despesa"},
  {n:"Entradas",k:"entrada"},{n:"Poupança",k:"poupanca"},{n:"Poupança (via conta conjunta)",k:"poupanca"},{n:"Cofres (reservas)",k:"reserva"},{n:"Investimento",k:"investimento"},{n:"Transferência interna",k:"interna"}
];
const CAT_KIND=Object.fromEntries(CATS.map(c=>[c.n,c.k]));
const KINDS={despesa:"Despesa",entrada:"Entrada",poupanca:"Poupança",investimento:"Investimento",reserva:"Reserva (cofres)",interna:"Transferência interna"};
let CUSTOM_CATS=[];
function setCustomCats(l){CUSTOM_CATS=Array.isArray(l)?l.filter(c=>c&&c.n&&KINDS[c.k]&&!CAT_KIND[c.n]):[];}
function allCats(){return [...CATS.filter(c=>c.k==="despesa"),...CUSTOM_CATS.filter(c=>c.k==="despesa"),...CATS.filter(c=>c.k!=="despesa"),...CUSTOM_CATS.filter(c=>c.k!=="despesa")];}
function kindOf(n){if(CAT_KIND[n])return CAT_KIND[n];const c=CUSTOM_CATS.find(x=>x.n===n);return c?c.k:"despesa";}
const DEFAULT_RULES=[
  ["conversão cambial para btc","Investimento"],["sell of","Investimento"],["jp morgan","Investimento"],
  ["xtb spolka","Transferência interna"],["eur revolut x","Transferência interna"],
  ["carregamento de subconta","Cofres (reservas)"],["poupança de acesso imediato","Poupança","conjunta"],["conta reforçada","Cofres (reservas)"],
  ["from investment account","Transferência interna"],["ordem permanente intrabancária para ana cristina","Poupança (via conta conjunta)","pessoal",150],["ana cristina paula amaro","Casa (conta conjunta)","pessoal"],
  ["intrabancária de","Entradas","conjunta"],["carregamento com apple pay","Entradas"],["cashback","Entradas"],
  ["levantamento de numerário","Levantamentos"],["via verde","Portagens"],
  ["auchan energy","Combustível"],["galp","Combustível"],["repsol","Combustível"],["bp ","Combustível"],["prio","Combustível"],
  ["uber","Transportes"],["bolt","Transportes"],["parque","Transportes"],["v2m","Transportes"],["sixt","Transportes"],["inspama","Transportes"],["pa ranholas","Combustível"],
  ["pd 462","Supermercado"],["462 mem martins","Supermercado"],["pingo doce","Supermercado"],["continente","Supermercado"],["lidl","Supermercado"],["mercadona","Supermercado"],
  ["auchan","Supermercado"],["intermarch","Supermercado"],["sodimoso","Supermercado"],["recheio","Supermercado"],["estacao da fruta","Supermercado"],
  ["rio de mouro","Supermercado","conjunta"],["mem martins","Supermercado","conjunta"],
  ["starbucks","Restauração"],["burger king","Restauração"],["eurest","Restauração"],["incomum","Restauração"],["panialves","Restauração"],["mcdonald","Restauração"],
  ["pizza hut","Restauração"],["sr. prego","Restauração"],["forneria","Restauração"],["valverd","Restauração"],["queijadas","Restauração"],["bagga","Restauração"],
  ["zin vending","Restauração"],["jeronymo","Restauração"],
  ["amazon prime","Subscrições"],["spotify","Subscrições"],["anthropic","Subscrições"],["netflix","Subscrições"],["apple.com","Subscrições"],["patreon","Subscrições"],
  ["serv. municipa","Casa e serviços"],["ikea","Casa e serviços"],["leroy merlin","Casa e serviços"],["coolares","Casa e serviços"],["espaco casa","Casa e serviços"],
  ["zara","Vestuário"],["pull&bear","Vestuário"],["tezenis","Vestuário"],["lefties","Vestuário"],["primark","Vestuário"],["mango","Vestuário"],
  ["amazon","Compras"],["sp seure","Compras"],["joom","Compras"],["centro colombo","Compras"],["rituals","Compras"],["el corte ingl","Compras"],["dstore","Compras"],["action","Compras"],["pixelcorner","Compras"],
  ["betclic","Apostas"],["placard","Apostas"],["santa casa","Apostas"],
  ["padel","Lazer e desporto"],["sport zone","Lazer e desporto"],["decathlon","Lazer e desporto"],["fútbol emotion","Lazer e desporto"],["prozis","Lazer e desporto"],
  ["cintramedica","Saúde"],["farmácia","Saúde"],["farmacia","Saúde"],["hospital","Saúde"],["wells","Saúde"],
  ["transferência imediata","Transferências a pessoas"],["payment","Transferências a pessoas"]
];
function categorize(row,rules,conta){
  const hay=(row.descricao+" "+row.detalhe).toLowerCase();
  for(const r of rules){if(r.conta&&conta&&r.conta!==conta)continue;if(r.valor!=null&&Math.abs(Math.abs(row.valor)-Math.abs(+r.valor))>0.004)continue;if(r.contem&&hay.includes(r.contem.toLowerCase()))return r.categoria;}
  return row.valor>0?"Entradas":"Outros";
}
function rowId(r,seen){let s=r.data+"|"+(r.dataValor||"")+"|"+r.descricao+"|"+r.valor+"|"+r.saldo,h=5381;for(let k=0;k<s.length;k++)h=((h<<5)+h+s.charCodeAt(k))>>>0;const b=h.toString(36);seen[b]=(seen[b]||0)+1;return b+"-"+seen[b];}
function ruleList(arr){return arr.map(([contem,categoria,conta,valor])=>{const o={contem,categoria};if(conta)o.conta=conta;if(valor!=null)o.valor=valor;return o;});}
function guessConta(holder){const h=holder||"";return /&/.test(h)||h.trim().split(/\s+/).length>6?"conjunta":"pessoal";}
// Split parsed rows into months by value date (Revolut statements group by value date)
function splitMonths(parsed){const by={};for(const x of parsed.rows){const m=(x.dataValor||x.data).slice(0,7);(by[m]=by[m]||[]).push(x);}
  const out={};for(const m in by){const rows=by[m];const first=rows[0],last=rows[rows.length-1];
    out[m]={rows,abertura:first.saldo!=null?Math.round((first.saldo-first.valor)*100)/100:null,fecho:last.saldo};}
  return out;}
if(typeof module!=="undefined")module.exports={CATS,CAT_KIND,DEFAULT_RULES,categorize,rowId,ruleList,guessConta,splitMonths,kindOf,allCats,setCustomCats};

// Revolut EUR statement parser (pdf.js text content -> rows)
async function parseRevolutPDF(pdfjsLib, data){
  const doc=await pdfjsLib.getDocument({data,isEvalSupported:false}).promise;
  const MONTHS={janeiro:1,fevereiro:2,"março":3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
  const DATE=/\d{2}\/\d{2}\/\d{4}/g;
  const AMT=/(-?[\d\s\u00a0.]*\d,\d{2})\s*€/;
  const toNum=s=>{const m=String(s||"").match(AMT);if(!m)return null;return parseFloat(m[1].replace(/[\s\u00a0.]/g,"").replace(",","."));};
  const iso=d=>{const [a,b,c]=d.split("/");return c+"-"+b+"-"+a;};
  const DETAIL=/^(Para:|Cartão:|Referência:|Taxa |Purchase of|De:|Data de|Montante)/i;
  let section=null,period=null,cur=null,holder=null;const rows=[];const summary={};const allLines=[];
  for(let p=1;p<=doc.numPages;p++){
    const page=await doc.getPage(p);const vp=page.getViewport({scale:1});
    const sx=vp.width/827, H=vp.height;
    const tc=await page.getTextContent();
    const items=tc.items.filter(it=>it.str&&it.str.trim()).map(it=>({x:it.transform[4]/sx,top:(H-it.transform[5])/sx,s:it.str}));
    items.sort((a,b)=>a.top-b.top||a.x-b.x);
    const lines=[];
    for(const it of items){const l=lines.find(l=>Math.abs(l.top-it.top)<4);if(l)l.items.push(it);else lines.push({top:it.top,items:[it]});}
    lines.sort((a,b)=>a.top-b.top);
    for(const l of lines){
      l.items.sort((a,b)=>a.x-b.x);
      const text=l.items.map(i=>i.s).join(" ").replace(/\s+/g," ").trim();
      allLines.push(text);
      if(l.top<185||l.top>990)continue; // page header / footer
      if(p===1&&holder===null&&section===null){holder=text;continue;}
      if(/^Operações da conta de/.test(text)){section="conta";const m=text.match(/de (\d+) de (\S+) de (\d{4})/);if(m)period=m[3]+"-"+String(MONTHS[m[2].toLowerCase()]||0).padStart(2,"0");cur=null;continue;}
      if(/^(Transações de|Operações de Poupança|Operações de)/.test(text)&&!/da conta de/.test(text)){section="outra";cur=null;continue;}
      const sm=text.match(/^(Conta \(Conta Corrente\)|Cofres Pessoais e de Grupo|Poupança de Acesso Imediato|Total)\s+(.*)$/);
      if(sm&&section===null){const vals=(sm[2].match(/-?[\d\s\u00a0.]*\d,\d{2}€/g)||[]).map(toNum);if(vals.length>=4)summary[sm[1]]={inicial:vals[0],retirado:vals[1],recebido:vals[2],final:vals[3]};continue;}
      if(/Dinheiro retirado|Lançamento|contabilístico|^Data\b/.test(text))continue;
      if(section!=="conta")continue;
      const col={d:"",desc:"",ret:"",rec:"",saldo:""};
      for(const it of l.items){const x=it.x;
        if(x<225)col.d+=" "+it.s;else if(x<460)col.desc+=" "+it.s;else if(x<575)col.ret+=" "+it.s;else if(x<690)col.rec+=" "+it.s;else col.saldo+=" "+it.s;}
      const dates=col.d.match(DATE);
      if(dates){cur={data:iso(dates[0]),dataValor:dates[1]?iso(dates[1]):null,lines:[],ret:toNum(col.ret),rec:toNum(col.rec),saldo:toNum(col.saldo)};rows.push(cur);}
      else if(!cur)continue;
      const d=col.desc.trim();if(d)cur.lines.push(d);
      if(!dates){ if(cur.ret==null&&toNum(col.ret)!=null)cur.ret=toNum(col.ret); if(cur.rec==null&&toNum(col.rec)!=null)cur.rec=toNum(col.rec);}
    }
  }
  const out=rows.map(r=>{
    let title=[],detail=[],inDetail=false;
    for(const ln of r.lines){if(DETAIL.test(ln))inDetail=true;(inDetail?detail:title).push(ln);}
    const valor=r.rec!=null?r.rec:(r.ret!=null?-r.ret:0);
    return {data:r.data,dataValor:r.dataValor,descricao:title.join(" ").replace(/\s+/g," ").trim(),detalhe:detail.join(" · ").replace(/Cartão:\s*\S+/g,"").replace(/\s+·\s*$/,"").trim(),valor:Math.round(valor*100)/100,saldo:r.saldo};
  });
  return {period,holder,rows:out,summary};
}
if(typeof module!=="undefined")module.exports={parseRevolutPDF};

(function(){
const eur=new Intl.NumberFormat("pt-PT",{style:"currency",currency:"EUR"});
const eur0=new Intl.NumberFormat("pt-PT",{style:"currency",currency:"EUR",maximumFractionDigits:0});
const pct=new Intl.NumberFormat("pt-PT",{style:"percent",minimumFractionDigits:1,maximumFractionDigits:1});
const $=id=>document.getElementById(id);
const INV_COLOR={"Cripto":"var(--c-cripto)","ETF Core":"var(--c-core)","ETF Agressivo":"var(--c-agr)","XTB Manual":"var(--c-man)","PPR":"var(--c-ppr)"};
const INV_ORDER=["Cripto","ETF Core","ETF Agressivo","XTB Manual","PPR"];
const SLUG={"Cripto":"cri","ETF Core":"core","ETF Agressivo":"agr","XTB Manual":"man","PPR":"ppr"};
function akey(cat,t){return cat+"~"+t;}
function ativosByKey(){const m={};for(const id in st.ativos){const d=st.ativos[id];m[akey(d.categoria||"Cripto",d.ticker||id)]={id,doc:d};}return m;}
const MES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DAY=86400000;
const st={lotes:[],ativos:{},real:[],meses:{},regras:null,regrasVer:false,filter:"all",editing:null,db:null,
  loaded:{},readonly:false,mes:null,ano:null,conta:"pessoal",catFilter:"",q:"",pending:null};

function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function parseD(s){if(!s)return null;const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d);}
function addYear(s){const [y,m,d]=s.split("-").map(Number);return Date.UTC(y+1,m-1,d);}
function fmtD(ms){return new Date(ms).toLocaleDateString("pt-PT",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric"});}
function fmtDs(s){return new Date(parseD(s)).toLocaleDateString("pt-PT",{timeZone:"UTC",day:"2-digit",month:"short"});}
function mesLabel(m){const [y,mm]=m.split("-");return MES[+mm-1]+" "+y;}
function signed(v){return (v>0?"+":"")+eur.format(v);}
function cls(v){return v>0.005?"pos":v<-0.005?"neg":"";}
function tick(s){return String(s||"").trim().toUpperCase().replace(/[^A-Z0-9._-]/g,"");}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function r2(v){return Math.round(v*100)/100;}
function rules(){return st.regras||ruleList(DEFAULT_RULES);}
const CONTA_LABEL={pessoal:"Pessoal",conjunta:"Conjunta"};
function mdoc(m){return st.meses[st.conta+"-"+m];}
function setStatus(t){$("status").textContent=t;}

/* ---------- routing ---------- */
const VIEWS=["financas","orcamentos","plano","poupanca","investimentos"];
function route(){const h=location.hash.slice(1);const v=VIEWS.includes(h)?h:"financas";
  for(const x of VIEWS){$("v-"+x).hidden=x!==v;$("tab-"+x).setAttribute("aria-current",x===v?"page":"false");}}
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
  // categories
  const cr=$("cat-rows");cr.innerHTML="";
  const entries=s?Object.entries(s.cats).filter(([,v])=>Math.abs(v)>0.004).sort((a,b)=>b[1]-a[1]):[];
  const max=entries.length?Math.max(...entries.map(e=>e[1])):1;
  for(const [c,v] of entries){
    const b=document.createElement("button");b.type="button";b.className="catrow";b.setAttribute("aria-pressed",String(st.catFilter===c));
    const pv=p&&p.cats[c]!=null?p.cats[c]:null;
    const delta=yearMode?eur0.format(v/nFull)+"/mês"+(pv!=null?" · "+((v-pv)>=0?"▲ ":"▼ ")+eur0.format(Math.abs(v-pv)):""):(pv!=null?((v-pv)>=0?"▲ ":"▼ ")+eur0.format(Math.abs(v-pv)):(p?"novo":""));
    b.innerHTML='<span class="cname">'+esc(c)+'</span><span class="track"><span style="width:'+Math.max(2,v/max*100).toFixed(1)+'%"></span></span><span class="amt">'+eur.format(v)+'<span class="delta">'+pct.format(s.despesas>0?v/s.despesas:0)+(delta?" · "+delta:"")+'</span></span>';
    b.addEventListener("click",()=>{st.catFilter=st.catFilter===c?"":c;$("mov-cat").value=st.catFilter;renderFin();});
    cr.appendChild(b);
  }
  $("cat-empty").hidden=entries.length>0;
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

/* ================= SHARED MONTH HELPERS ================= */
function curMonth(){return todayStr().slice(0,7);}
function isPartial(m){return m===curMonth();}
function docFor(conta,m){return st.meses[conta+"-"+m];}
function monthsOf(conta){return Object.values(st.meses).filter(d=>d.conta===conta).map(d=>d.mes).sort();}
function statsFor(conta,m){
  const doc=docFor(conta,m);const s={entradas:0,despesas:0,poupado:0,investido:0,reserva:0,cats:{},paraConjunta:0,viaConj:0};
  if(!doc)return null;
  for(const r of doc.movimentos||[]){if(r.excluido)continue;const k=kindOf(r.categoria);
    if(k==="entrada")s.entradas+=r.valor;else if(k==="poupanca"){s.poupado-=r.valor;if(r.categoria==="Poupança (via conta conjunta)")s.viaConj-=r.valor;}
    else if(k==="investimento")s.investido-=r.valor;else if(k==="reserva")s.reserva-=r.valor;
    else if(k==="despesa"){s.despesas-=r.valor;s.cats[r.categoria]=(s.cats[r.categoria]||0)-r.valor;if(r.categoria==="Casa (conta conjunta)")s.paraConjunta-=r.valor;}}
  return s;
}
function mShort(m){return MES[+m.slice(5)-1].slice(0,3)+" "+m.slice(2,4);}
function pctOrDash(v){return v==null||!isFinite(v)?"—":pct.format(v);}

/* ================= ORÇAMENTOS ================= */
st.orcConta="pessoal";st.orcMes=null;st.orc=null;st.orcDraft=null;
function budgetFor(conta,ano){const p=ano&&st.planos&&st.planos[ano]&&st.planos[ano][conta];if(p&&p.cats&&Object.keys(p.cats).length)return p.cats;return (st.orc&&st.orc[conta])||{};}
function usingPlan(conta,ano){const p=ano&&st.planos&&st.planos[ano]&&st.planos[ano][conta];return !!(p&&p.cats&&Object.keys(p.cats).length);}
function renderOrc(){
  const conta=st.orcConta;const ms=monthsOf(conta);const sel=$("orc-mes");
  if(!st.orcMes||!ms.includes(st.orcMes)){const full=ms.filter(x=>!isPartial(x));st.orcMes=full[full.length-1]||ms[ms.length-1]||null;}
  sel.innerHTML=ms.length?ms.slice().reverse().map(m=>'<option value="'+m+'"'+(m===st.orcMes?" selected":"")+'>'+mesLabel(m)+(isPartial(m)?" (em curso)":"")+'</option>').join(""):'<option>Sem extratos</option>';
  sel.disabled=!ms.length;
  const orcAno=(st.orcMes||curMonth()).slice(0,4);const bud=st.orcDraft||budgetFor(conta,orcAno);const m=st.orcMes;const s=m?statsFor(conta,m):null;
  const full=ms.filter(x=>!isPartial(x));const year=(m||curMonth()).slice(0,4);const ytd=full.filter(x=>x.slice(0,4)===year&&(!m||x<=m));
  const totB=Object.values(bud).reduce((a,b)=>a+(+b||0),0);
  let gastoB=0,exc=0;const tb=$("t-orc");tb.innerHTML="";
  const last3=full.filter(x=>!m||x<=m).slice(-3);const avg={};
  for(const x of last3){const sx=statsFor(conta,x);for(const c in sx.cats)avg[c]=(avg[c]||0)+sx.cats[c]/last3.length;}
  const catsShown=allCats().filter(c=>c.k==="despesa").map(c=>c.n).filter(c=>(+bud[c]>0)||Math.abs(avg[c]||0)>0.004);
  let okMonths=0,totMonths=0;
  for(const c of catsShown){const b=+bud[c]||0;const g=avg[c]||0;if(b>0){gastoB+=g;if(g>b+0.005)exc++;}
    let inM=0,yG=0;for(const x of ytd){const sx=statsFor(conta,x);const gx=sx.cats[c]||0;yG+=gx;if(b>0&&gx<=b+0.005)inM++;}
    if(b>0){okMonths+=inM;totMonths+=ytd.length;}
    const ratio=b>0?g/b:null;const col=ratio==null?"var(--muted)":ratio>1?"var(--neg)":ratio>0.85?"var(--warn)":"var(--pos)";
    const chip=b>0?(ratio>1?'<span class="chip miss">excedido</span>':ratio>0.85?'<span class="chip wait">perto do limite</span>':'<span class="chip ok">dentro</span>'):'<span class="chip na">sem orçamento</span>';
    const tr=document.createElement("tr");
    tr.innerHTML='<td>'+esc(c)+'</td><td class="r"><input class="orc-in num" type="number" step="5" min="0" inputmode="decimal" aria-label="Orçamento de '+esc(c)+'" value="'+(b>0?b:"")+'" placeholder="—" '+(st.readonly?"disabled":"")+'></td>'+
      '<td class="r num">'+eur.format(g)+'</td><td class="r num '+(b>0?cls(b-g):"")+'">'+(b>0?eur.format(b-g):"—")+'</td>'+
      '<td><span class="pbar"><span style="width:'+(ratio==null?0:Math.min(100,ratio*100)).toFixed(0)+'%;background:'+col+'"></span></span> '+chip+'</td>'+
      '<td class="r num">'+(b>0&&ytd.length?inM+"/"+ytd.length+' meses<div class="note">'+eur0.format(yG)+' de '+eur0.format(b*ytd.length)+'</div>':'<span class="muted">—</span>')+'</td>';
    tb.appendChild(tr);
    tr.querySelector("input").addEventListener("input",e=>{st.orcDraft={...(st.orcDraft||budgetFor(conta,orcAno))};const v=parseFloat(e.target.value);if(isFinite(v)&&v>0)st.orcDraft[c]=v;else delete st.orcDraft[c];$("orc-msg").textContent="Alterações por guardar.";});
  }
  // add-category row for budgets on categories without spending
  const missing=allCats().filter(c=>c.k==="despesa"&&!catsShown.includes(c.n));
  if(missing.length&&!st.readonly){const tr=document.createElement("tr");tr.innerHTML='<td colspan="6"><select id="orc-add" aria-label="Adicionar categoria ao orçamento" style="width:auto"><option value="">+ Adicionar categoria…</option>'+missing.map(c=>'<option>'+esc(c.n)+'</option>').join("")+'</select></td>';tb.appendChild(tr);
    tr.querySelector("select").addEventListener("change",e=>{if(!e.target.value)return;st.orcDraft={...(st.orcDraft||budgetFor(conta,orcAno)),[e.target.value]:50};$("orc-msg").textContent="Alterações por guardar.";renderOrc();});}
  const set=(id,v,sub,c)=>{$(id).textContent=v;$(id).className="big "+(c||"");$(id+"-sub").textContent=sub||" ";};
  set("o-tot",totB?eur.format(totB):"—",totB?Object.keys(bud).length+" categorias":"Define valores na tabela");
  const gShow=totB?gastoB:Object.values(avg).reduce((x,y)=>x+y,0);
  set("o-gasto",last3.length?eur.format(gShow):"—",last3.length?"média de "+last3.map(mShort).join(", "):"");
  set("o-rest",totB?eur.format(totB-gastoB):"—",exc?exc+" categoria"+(exc>1?"s":"")+" excedida"+(exc>1?"s":""):"nenhuma categoria excedida",totB?cls(totB-gastoB):"");
  set("o-ano",totMonths?pct.format(okMonths/totMonths):"—",totMonths?okMonths+" de "+totMonths+" categoria-mês dentro do orçamento":"precisa de orçamento definido");
  $("orc-note").textContent=(usingPlan(conta,orcAno)?"A usar o Plano "+orcAno+" · ":"")+(s?"Despesas do mês: "+eur.format(s.despesas):"");
}
$("orc-conta").addEventListener("click",e=>{const b=e.target.closest("button[data-c]");if(!b)return;st.orcConta=b.dataset.c;st.orcDraft=null;$("orc-msg").textContent="";
  for(const x of $("orc-conta").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));renderOrc();});
$("orc-mes").addEventListener("change",e=>{st.orcMes=e.target.value;renderOrc();});
$("orc-sug").addEventListener("click",()=>{const conta=st.orcConta;const full=monthsOf(conta).filter(m=>!isPartial(m)).slice(-3);
  if(!full.length){$("orc-msg").textContent="Importa pelo menos um mês completo.";return;}
  const sum={};for(const m of full){const s=statsFor(conta,m);for(const c in s.cats)sum[c]=(sum[c]||0)+s.cats[c];}
  const d={};for(const c in sum){const v=Math.ceil(sum[c]/full.length/5)*5;if(v>0)d[c]=v;}
  st.orcDraft=d;$("orc-msg").textContent="Sugestão pela média de "+full.map(mShort).join(", ")+", arredondada a 5 €. Ajusta e guarda.";renderOrc();});
$("orc-save").addEventListener("click",async()=>{if(!st.db)return;const conta=st.orcConta;const ano=(st.orcMes||curMonth()).slice(0,4);const d=st.orcDraft||budgetFor(conta,ano);
  if(usingPlan(conta,ano)){const pd=JSON.parse(JSON.stringify(st.planos[ano]));pd[conta].cats=d;try{await st.db.collection("planos").doc(ano).set(pd);st.orcDraft=null;$("orc-msg").textContent="Plano "+ano+" atualizado.";}catch(e){$("orc-msg").textContent="Não foi possível guardar.";}return;}
  const all={...(st.orc||{}),[conta]:d};
  try{await st.db.collection("config").doc("orcamentos").set(all);st.orcDraft=null;$("orc-msg").textContent="Orçamento guardado.";}catch(e){$("orc-msg").textContent="Não foi possível guardar o orçamento.";}});

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
  $("pl-note").textContent=planOf(ano,conta)?"Plano guardado"+(st.plDraft?" · alterações por guardar":""):(st.plDraft?"Plano por guardar":"Ainda sem plano para "+ano);
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
  try{await st.db.collection("planos").doc(ano).set(doc);st.plDraft=null;$("pl-msg").textContent="Plano de "+ano+" guardado.";}catch(e){$("pl-msg").textContent="Não foi possível guardar o plano.";}});

/* ================= IMPORTADORES XTB E CRIPTO ================= */
const PLAN_DEFAULT_SUB={"52137503":"ETF Agressivo","52148668":"ETF Core"};
const AGR_DEFAULT=new Set(["RBOT.UK","XDWT.DE","LYPG.DE"]);
function slugT(t){return String(t).replace(/[^A-Za-z0-9_\-~:@+]/g,"_");}
function targetMonth(d){const iso=d.toISOString?d.toISOString().slice(0,10):String(d).slice(0,10);const y=+iso.slice(0,4),m=+iso.slice(5,7),day=+iso.slice(8,10);
  if(day<=5){const pm=m===1?12:m-1,py=m===1?y-1:y;return {m:py+"-"+String(pm).padStart(2,"0"),parcial:false};}
  return {m:iso.slice(0,7),parcial:iso.slice(0,7)===curMonth()};}
function addMonthOf(obj,m,v){obj[m]=(obj[m]||0)+v;}
async function xlsxLib(){if(window.XLSX)return window.XLSX;await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");return window.XLSX;}
function sheetRows(XLSX,wb,name){const ws=wb.Sheets[name];return ws?XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null}):null;}
function toDate(v){if(v&&typeof v.getTime==="function")return new Date(v.getTime());if(typeof v==="number")return new Date(Math.round((v-25569)*86400000));if(typeof v==="string"&&v)return new Date(v.replace(" ","T")+(v.length<=19?"Z":""));return null;}
function planGroupFor(ticker){
  const ex=st.lotes.find(l=>l.origem==="xtb"&&l.ticker===ticker&&(l.categoria==="ETF Core"||l.categoria==="ETF Agressivo"));
  if(ex)return ex.categoria;return AGR_DEFAULT.has(ticker)?"ETF Agressivo":"ETF Core";}
async function parseXTB(file){
  const XLSX=await xlsxLib();const wb=XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:"array",cellDates:true});
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
  for(const l of st.lotes)if(l.origem==="xtb"&&!keepL.has(l.id)){await st.db.collection("lotes").doc(l.id).delete();n++;}
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
    for(const m in r.ap[g]){H[g][m]=H[g][m]||{};H[g][m].a=r2(r.ap[g][m]);}
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
function mInvestSeries(){const H=histGroups();const allM=[...new Set(Object.values(H).flatMap(s=>Object.keys(s)))].sort();
  const full=GROUPS.map(g=>g[0]).filter(id=>H[id]&&allM.every(m=>H[id][m]&&H[id][m].v!=null));const pts=[];let base=null,acc=0;
  for(const m of allM){let v=0;for(const id of full)v+=H[id][m].v;if(base===null)base=v;else for(const id of full)acc+=+H[id][m].a||0;pts.push({m,v,a:base+acc});}return pts;}

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
      else h+='<div class="m-sub">Sem orçamento definido para '+ano+'. Define-o no Plano anual (versão completa).</div>';
      if(proj!=null)h+='<div class="m-sub">Ao ritmo atual terminas o mês com cerca de <b>'+eur0.format(proj)+'</b>'+(totB?' ('+(proj<=totB?"dentro":"acima")+' do orçamento)':'')+'.</div>';
      h+='</div>';
      const alerts=Object.keys(bud).filter(c=>+bud[c]>0).map(c=>({c,b:+bud[c],g:s.cats[c]||0})).filter(x=>x.g/x.b>0.85).sort((a,b)=>b.g/b.b-a.g/a.b);
      if(alerts.length)h+='<div class="m-card"><div class="eyebrow">Atenção</div>'+alerts.map(a=>'<button type="button" class="m-row" data-gocat="'+esc(a.c)+'"><span>'+esc(a.c)+'</span><span class="chip '+(a.g>a.b?"miss":"wait")+'">'+(a.g>a.b?"+"+eur0.format(a.g-a.b):Math.round(a.g/a.b*100)+"%")+'</span></button>').join("")+'</div>';
      const g=goalFor(st.m.scope);const rate=s.entradas>0?s.poupado/s.entradas:null;
      h+='<div class="m-grid"><div class="m-card"><div class="eyebrow">Poupança</div><div class="m-mid">'+eur0.format(s.poupado)+'</div><div class="m-sub">'+(g.mensal?"objetivo "+eur0.format(g.mensal):"taxa "+pctOrDash(rate))+'</div>'+(g.mensal?mBar(s.poupado,g.mensal,s.poupado>=g.mensal?"var(--pos)":"var(--warn)"):"")+'</div>'+
        '<div class="m-card"><div class="eyebrow">Entradas</div><div class="m-mid">'+eur0.format(s.entradas)+'</div><div class="m-sub">investido '+eur0.format(s.investido)+'</div></div></div>';
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
  h+=f.length>1?bigLines(pts)+'<p class="note">'+mLbl(f[0].m,true)+' a '+mLbl(last.m,true)+' · '+f.length+' fechos mensais · '+(sel?'clica outra vez na linha para voltar ao total':'clica numa linha da tabela para ver só esse investimento')+'</p>'+(()=>{if(sel)return "";const allM=[...new Set(Object.values(H).flatMap(x=>Object.keys(x)))];const ex=GROUPS.filter(g=>H[g[0]]&&!allM.every(m=>H[g[0]][m]&&H[g[0]][m].v!=null)).map(g=>g[1]);return ex.length?'<p class="note">O total do gráfico não inclui '+esc(ex.join(", "))+', por ainda não terem valor em todos os meses. Clica na linha de cada um para o ver.</p>':"";})():'<div class="empty">Ainda há poucos fechos mensais para desenhar este gráfico.</div>';
  el.innerHTML=h;
  // linhas da tabela clicáveis
  const ids=GROUPS.filter(g=>H[g[0]]).map(g=>g[0]);const rows=[...document.querySelectorAll("#t-rent tr")];
  rows.forEach((tr,i)=>{const id=ids[i];if(!id)return;tr.dataset.g=id;tr.style.cursor="pointer";tr.classList.toggle("sel",id===st.dInv);tr.title="Ver o gráfico deste investimento";});
}
{const a=renderRent;renderRent=function(){a.apply(this,arguments);renderDeskInvChart();};}
document.addEventListener("click",e=>{const tr=e.target.closest("#t-rent tr[data-g]");if(tr){st.dInv=st.dInv===tr.dataset.g?null:tr.dataset.g;renderDeskInvChart();$("rent-chart").scrollIntoView({behavior:"smooth",block:"nearest"});return;}
  const p=e.target.closest("[data-dper]");if(p){st.m.per=p.dataset.dper;renderDeskInvChart();}});

/* ---------- PPR (extrato mensal Optimize) ---------- */
const PPR_NOMES={AGRES:"Agressivo",AGRESSIVO:"Agressivo",ATIVO:"Ativo",EQUIL:"Equilibrado",EQUILIBRADO:"Equilibrado",MODER:"Moderado",MODERADO:"Moderado",LEOPARDO:"Leopardo"};
function pprGroups(){for(const id in st.ativos){const a=st.ativos[id];if(a.categoria!=="PPR")continue;const t=a.ticker||id;
  if(!GROUPS.some(g=>g[0]===t))GROUPS.push([t,(a.nome||t)+(a.titular?" · "+a.titular:""),"PPR",t]);}}
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
/* ---------- sincronização Revolut ---------- */
function syncInfo(){const s=st.sync;if(!s)return null;
  const quando=s.ultimaExec?new Date(s.ultimaExec):null;const dias=s.valido_ate?Math.floor((new Date(s.valido_ate)-Date.now())/864e5):null;
  const txt=s.erro?s.erro:("Revolut sincronizada"+(quando?" "+quando.toLocaleDateString("pt-PT",{day:"2-digit",month:"short"})+" às "+quando.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}):"")+(dias!=null?" · autorização válida por "+dias+" dias":""));
  const alerta=!!s.erro||(dias!=null&&dias<=14);return {txt,alerta,dias,erro:s.erro};}
function renderSync(){const i=syncInfo();const el=$("sync-line");if(el){el.hidden=!i;if(i){el.textContent=i.txt;el.className="note "+(i.alerta?"neg":"");}}scheduleM&&scheduleM();}

/* ---------- boot ---------- */
function render(){renderCats();renderFin();renderOrc();renderPlano();renderPoup();renderInv();renderRent();}
function setReadonly(){st.readonly=true;for(const f of document.querySelectorAll("form input,form select,form button,#imp-file"))f.disabled=true;setStatus("Só leitura: apenas o dono pode alterar estes registos.");render();}
$("l-data").value=todayStr();$("r-data").value=todayStr();route();render();
(async()=>{
  const c=window.claude;const db=c&&c.use?await c.use("db"):null;
  if(!db){setStatus("Inicia sessão para ver os teus registos.");for(const f of document.querySelectorAll("form button,#imp-file"))f.disabled=true;return;}
  st.db=db;const need=["l","a","r","m","c","o","g","h","k","p"];
  const timer=setTimeout(()=>(()=>{let tried=false;try{tried=localStorage.getItem("mf-lp")==="1";}catch(e){}
    if(!tried){try{localStorage.setItem("mf-lp","1");}catch(e){}setStatus("A tentar um modo de ligação alternativo…");setTimeout(()=>location.reload(),600);return;}
    setStatus("Sem ligação ao servidor: estás a ver os dados guardados neste dispositivo. A rede onde estás (por exemplo a da empresa) pode estar a bloquear firestore.googleapis.com. Experimenta outra rede.");})(),10000);
  const done=(k,s)=>{if(!s.metadata.fromCache)st.loaded[k]=true;if(need.every(x=>st.loaded[x])){clearTimeout(timer);setStatus("Atualizado às "+new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}));}};
  const onErr=e=>{clearTimeout(timer);setStatus(e&&e.code==="revoked"?"O acesso aos registos terminou.":"Não foi possível carregar os registos.");};
  db.collection("lotes").onSnapshot(s=>{st.lotes=s.docs.map(d=>({id:d.id,...d.data()}));done("l",s);renderInv();},onErr);
  db.collection("ativos").onSnapshot(s=>{const m={};for(const d of s.docs)m[d.id]=d.data();st.ativos=m;pprGroups();done("a",s);renderInv();$("fe-rows").dataset.m="";renderFecho();},onErr);
  db.collection("realizados").onSnapshot(s=>{st.real=s.docs.map(d=>({id:d.id,...d.data()}));done("r",s);renderInv();},onErr);
  db.collection("meses").onSnapshot(s=>{const m={};for(const d of s.docs)m[d.id]=d.data();st.meses=m;done("m",s);renderFin();renderOrc();renderPlano();renderPoup();},onErr);
  db.doc("config/categorias").onSnapshot(d=>{setCustomCats(d.exists?d.data().lista:[]);done("k",d);renderCats();refreshCatSelects();renderFin();renderOrc();renderPlano();renderPoup();},onErr);
  db.collection("planos").onSnapshot(s=>{const m={};for(const d of s.docs)m[d.id]=d.data();st.planos=m;done("p",s);renderPlano();renderOrc();},onErr);
  db.doc("config/orcamentos").onSnapshot(d=>{st.orc=d.exists?d.data():null;done("o",d);renderOrc();},onErr);
  db.doc("config/objetivos").onSnapshot(d=>{st.goals=d.exists?d.data():null;done("g",d);renderPoup();},onErr);
  db.doc("historico/carteira").onSnapshot(d=>{st.hist=d.exists?d.data():null;done("h",d);renderRent();},onErr);
  db.doc("sync/revolut").onSnapshot(d=>{st.sync=d.exists?d.data():null;renderSync();},()=>{});
  db.doc("config/regras").onSnapshot(d=>{st.regras=d.exists&&Array.isArray(d.data().lista)?d.data().lista:null;done("c",d);renderFin();},onErr);
  try{const u=await c.use("user");if(u&&typeof u.isOwner==="function"&&(await u.isOwner())===false)setReadonly();}catch(e){}
})();
})();
