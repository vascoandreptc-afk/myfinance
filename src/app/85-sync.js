/* ---------- sincronização Revolut ---------- */
function syncInfo(){const s=st.sync;if(!s)return null;
  const quando=s.ultimaExec?new Date(s.ultimaExec):null;const dias=s.valido_ate?Math.floor((new Date(s.valido_ate)-Date.now())/864e5):null;
  const txt=s.erro?s.erro:("Revolut sincronizada"+(quando?" "+quando.toLocaleDateString("pt-PT",{day:"2-digit",month:"short"})+" às "+quando.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}):"")+(dias!=null?" · autorização válida por "+dias+" dias":""));
  const alerta=!!s.erro||(dias!=null&&dias<=14);return {txt,alerta,dias,erro:s.erro};}
function renderAuto(){const el=$("auto-line");if(!el)return;const a=st.auto;if(!a){el.hidden=true;return;}
  const N={email:"Extratos por email (XTB, Optimize)",cripto:"Cripto pela Revolut X",xtb:"Estimativa diária da XTB"};
  const q=x=>{const d=new Date(x.quando);return d.toLocaleDateString("pt-PT",{day:"2-digit",month:"short"})+" às "+d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"});};
  el.innerHTML=Object.keys(N).filter(k=>a[k]).map(k=>{const x=a[k];return '<div><b>'+N[k]+':</b> '+(x.porConfigurar?'por configurar':x.ok?esc(x.resumo||"ok")+' <span class="muted">('+q(x)+')</span>':'<span class="neg">erro: '+esc(x.erro||"")+'</span>')+'</div>';}).join("");
  el.hidden=!el.innerHTML;}
function renderSync(){const i=syncInfo();const el=$("sync-line");if(el){el.hidden=!i;if(i){el.textContent=i.txt;el.className="note "+(i.alerta?"neg":"");}}scheduleM&&scheduleM();}

