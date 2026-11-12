/* ---------- erros: um erro ao desenhar não pode parar a base de dados ---------- */
st.errs=[];
function showErr(e,where){const msg=(e&&e.message)||String(e);if(st.errs.includes(msg))return;st.errs.push(msg);console.error(where||"erro",e);
  try{const el=$("status");el.textContent="Erro na app"+(where?" ("+where+")":"")+": "+msg+" — envia esta mensagem ao Claude.";el.style.color="var(--neg)";}catch(_){}}
function safeCb(fn){return function(){try{return fn.apply(this,arguments);}catch(e){showErr(e,"ao atualizar");}};}
window.addEventListener("error",e=>showErr(e.error||e.message,"página"));
window.addEventListener("unhandledrejection",e=>showErr(e.reason,"promessa"));
