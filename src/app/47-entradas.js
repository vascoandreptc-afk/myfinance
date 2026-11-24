/* ---------- Definições: entradas do fim do mês ---------- */
function renderEntCfg(){const c=entCfg();const a=$("ent-ativo"),d=$("ent-dia");if(!a)return;a.checked=!!c.ativo;d.value=c.dia;a.disabled=d.disabled=!!st.readonly;}
async function guardarEntCfg(){const dia=Math.min(31,Math.max(15,parseInt($("ent-dia").value,10)||25));
  try{await st.db.collection("config").doc("entradas").set({...entCfg(),ativo:$("ent-ativo").checked,dia});$("ent-msg").textContent="Guardado.";}catch(e){$("ent-msg").textContent="Não foi possível guardar.";}}
$("ent-ativo").addEventListener("change",guardarEntCfg);$("ent-dia").addEventListener("change",guardarEntCfg);
