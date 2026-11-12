/* ========== POUPANÇA DE ACESSO IMEDIATO: saldo do último extrato + transferências sincronizadas depois dele ==========
   config/poupancas = {<conta>: {saldo, data, fonte}} — atualizado ao importar um extrato EUR da Revolut (na app ou por email). */
const RE_PAI=/Poupan[çc]a de Acesso Imediato/i;
async function guardarPoupancaExtrato(conta,r){const p=r&&r.summary&&r.summary["Poupança de Acesso Imediato"];if(!p||p.final==null)return;
  const data=r.fim||r.rows.map(x=>x.data).sort().pop();if(!data)return;const ant=st.poupancas&&st.poupancas[conta];if(ant&&ant.data>data)return;
  try{await st.db.collection("config").doc("poupancas").set({...(st.poupancas||{}),[conta]:{saldo:p.final,data,fonte:"extrato"}});}catch(e){showErr(e,"poupança");}}
function saldoPoupanca(conta){const b=st.poupancas&&st.poupancas[conta];if(!b)return null;let s=+b.saldo||0,n=0;
  for(const d of Object.values(st.meses))if(d.conta===conta)for(const x of d.movimentos||[])if(!x.excluido&&x.data>b.data&&RE_PAI.test(x.descricao+" "+(x.detalhe||""))){s-=x.valor;n++;}
  return {saldo:r2(s),base:b,n};}
function poupancasLista(){return ["conjunta","pessoal"].map(c=>({conta:c,...(saldoPoupanca(c)||{})})).filter(x=>x.base&&(x.saldo>0.004||x.n));}
function renderPoupancas(){const blk=$("pai-block");if(!blk)return;const L=poupancasLista();blk.hidden=!L.length;if(!L.length)return;
  $("pai-list").innerHTML=L.map(x=>'<div class="rule"><span>Conta '+CONTA_LABEL[x.conta].toLowerCase()+'</span><span class="num">'+eur.format(x.saldo)+'</span></div>').join("");
  $("pai-total").textContent=eur.format(L.reduce((a,x)=>a+x.saldo,0));
  $("pai-nota").textContent="Valor exato no extrato de "+L.map(x=>fmtDs(x.base.data)).join(" / ")+"; depois disso soma as transferências sincronizadas (os juros só entram com o próximo extrato).";
  scheduleM&&scheduleM();}
function poupancasMobile(){const L=poupancasLista();if(!L.length)return "";
  return '<div class="m-card"><div class="eyebrow">Poupança de Acesso Imediato</div><div class="m-mid">'+eur0.format(L.reduce((a,x)=>a+x.saldo,0))+'</div>'+(L.length>1?L.map(x=>'<div class="m-row"><span>Conta '+CONTA_LABEL[x.conta].toLowerCase()+'</span><span class="num">'+eur0.format(x.saldo)+'</span></div>').join(""):'<div class="m-sub">conta '+CONTA_LABEL[L[0].conta].toLowerCase()+' · sem juros desde o extrato de '+fmtDs(L[0].base.data)+'</div>')+'</div>';}
