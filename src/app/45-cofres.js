/* ================= COFRES (saldos das subcontas poupança da Revolut, via sincronização) ================= */
function cofresLista(){const c=st.cofres;if(!c||!c.contas)return [];const nomes=(st.cofresNomes&&st.cofresNomes.nomes)||{};
  return Object.entries(c.contas).map(([uid,x],i)=>({uid,nome:nomes[uid]||"Cofre "+String.fromCharCode(65+i),semNome:!nomes[uid],saldo:+x.saldo||0,data:x.data})).sort((a,b)=>b.saldo-a.saldo);}
function cofresQuando(){const c=st.cofres;if(!c||!c.atualizado)return "";const d=new Date(c.atualizado);return "atualizado "+d.toLocaleDateString("pt-PT",{day:"2-digit",month:"short"})+" às "+d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"});}
function renderCofres(){const blk=$("cofres-block");if(!blk)return;const L=cofresLista();blk.hidden=!L.length;if(!L.length)return;
  $("cofres-total").textContent=eur.format(L.reduce((a,x)=>a+x.saldo,0));$("cofres-data").textContent=cofresQuando();
  $("cofres-list").innerHTML=L.map(x=>'<div class="rule"><button type="button" class="btn-link" data-cofre="'+esc(x.uid)+'" title="Mudar o nome">'+esc(x.nome)+(x.semNome?' ✎':'')+'</button><span class="num">'+eur.format(x.saldo)+'</span></div>').join("");
  scheduleM&&scheduleM();}
function cofresMobile(){const L=cofresLista();if(!L.length)return "";
  return '<div class="m-card"><div class="eyebrow">Cofres</div><div class="m-mid">'+eur0.format(L.reduce((a,x)=>a+x.saldo,0))+'</div>'+L.map(x=>'<div class="m-row"><span>'+esc(x.nome)+'</span><span class="num">'+eur0.format(x.saldo)+'</span></div>').join("")+'<div class="m-sub">'+esc(cofresQuando())+'</div></div>';}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-cofre]");if(!b||st.readonly)return;
  const L=cofresLista();const x=L.find(y=>y.uid===b.dataset.cofre);const n=window.prompt("Nome deste cofre ("+eur.format(x.saldo)+"):",x.semNome?"":x.nome);if(n==null)return;
  const nomes={...((st.cofresNomes&&st.cofresNomes.nomes)||{})};if(n.trim())nomes[x.uid]=n.trim().slice(0,40);else delete nomes[x.uid];
  try{await st.db.collection("config").doc("cofres").set({nomes});}catch(err){showErr(err,"cofres");}});
