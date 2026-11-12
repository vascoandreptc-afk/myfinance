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

