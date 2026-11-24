/* ================= SHARED MONTH HELPERS ================= */
function curMonth(){return todayStr().slice(0,7);}
function isPartial(m){return m===curMonth();}
function docFor(conta,m){return st.meses[conta+"-"+m];}
function monthsOf(conta){return Object.values(st.meses).filter(d=>d.conta===conta).map(d=>d.mes).sort();}
/* Entradas do fim do mês (ex.: carregamento do salário a 28) contam para o mês seguinte, onde são gastas.
   config/entradas = {ativo, dia, contas[]}; por movimento, mesRef = "AAAA-MM" fixa o mês à mão. */
const ENT_PADRAO={ativo:true,dia:25,contas:["pessoal","conjunta"]};
function entCfg(){return {...ENT_PADRAO,...(st.entCfg||{})};}
function mesSeguinte(m){const [y,mm]=m.split("-").map(Number);return mm===12?(y+1)+"-01":y+"-"+String(mm+1).padStart(2,"0");}
function mesAnterior(m){const [y,mm]=m.split("-").map(Number);return mm===1?(y-1)+"-12":y+"-"+String(mm-1).padStart(2,"0");}
function mesDaEntrada(r,conta){const m=r.data.slice(0,7);if(r.mesRef)return r.mesRef;const c=entCfg();
  if(!c.ativo||r.valor<=0||kindOf(r.categoria)!=="entrada"||(c.contas&&!c.contas.includes(conta)))return m;
  return +r.data.slice(8,10)>=(+c.dia||25)?mesSeguinte(m):m;}
function entradasVindas(conta,m){const d=docFor(conta,mesAnterior(m));return d?(d.movimentos||[]).filter(r=>!r.excluido&&kindOf(r.categoria)==="entrada"&&mesDaEntrada(r,conta)===m):[];}
function statsFor(conta,m){
  const doc=docFor(conta,m);const s={entradas:0,despesas:0,poupado:0,investido:0,reserva:0,cats:{},paraConjunta:0,viaConj:0};
  if(!doc)return null;
  for(const r of doc.movimentos||[]){if(r.excluido)continue;const k=kindOf(r.categoria);
    if(k==="entrada"){if(mesDaEntrada(r,conta)===m)s.entradas+=r.valor;}else if(k==="poupanca"){s.poupado-=r.valor;if(r.categoria==="Poupança (via conta conjunta)")s.viaConj-=r.valor;}
    else if(k==="investimento")s.investido-=r.valor;else if(k==="reserva")s.reserva-=r.valor;
    else if(k==="despesa"){s.despesas-=r.valor;s.cats[r.categoria]=(s.cats[r.categoria]||0)-r.valor;if(r.categoria==="Casa (conta conjunta)")s.paraConjunta-=r.valor;}}
  for(const r of entradasVindas(conta,m))s.entradas+=r.valor;
  return s;
}
function mShort(m){return MES[+m.slice(5)-1].slice(0,3)+" "+m.slice(2,4);}
function pctOrDash(v){return v==null||!isFinite(v)?"—":pct.format(v);}

