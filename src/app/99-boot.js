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
  db.collection("lotes").onSnapshot(safeCb(s=>{st.lotes=s.docs.map(d=>({id:d.id,...d.data()}));done("l",s);renderInv();}),onErr);
  db.collection("ativos").onSnapshot(safeCb(s=>{const m={};for(const d of s.docs)m[d.id]=d.data();st.ativos=m;pprGroups();done("a",s);renderInv();$("fe-rows").dataset.m="";renderFecho();}),onErr);
  db.collection("realizados").onSnapshot(safeCb(s=>{st.real=s.docs.map(d=>({id:d.id,...d.data()}));done("r",s);renderInv();}),onErr);
  db.collection("meses").onSnapshot(safeCb(s=>{const m={};for(const d of s.docs)m[d.id]=d.data();st.meses=m;done("m",s);renderFin();renderOrc();renderPlano();renderPoup();}),onErr);
  db.doc("config/categorias").onSnapshot(safeCb(d=>{setCustomCats(d.exists?d.data().lista:[]);done("k",d);renderCats();refreshCatSelects();renderFin();renderOrc();renderPlano();renderPoup();}),onErr);
  db.collection("planos").onSnapshot(safeCb(s=>{const m={};for(const d of s.docs)m[d.id]=d.data();st.planos=m;done("p",s);renderPlano();renderOrc();}),onErr);
  db.doc("config/orcamentos").onSnapshot(safeCb(d=>{st.orc=d.exists?d.data():null;done("o",d);renderOrc();}),onErr);
  db.doc("config/objetivos").onSnapshot(safeCb(d=>{st.goals=d.exists?d.data():null;done("g",d);renderPoup();}),onErr);
  db.doc("historico/carteira").onSnapshot(safeCb(d=>{st.hist=d.exists?d.data():null;done("h",d);renderRent();}),onErr);
  db.doc("sync/revolut").onSnapshot(safeCb(d=>{st.sync=d.exists?d.data():null;renderSync();}),()=>{});
  db.doc("config/regras").onSnapshot(safeCb(d=>{st.regras=d.exists&&Array.isArray(d.data().lista)?d.data().lista:null;done("c",d);renderFin();}),onErr);
  try{const u=await c.use("user");if(u&&typeof u.isOwner==="function"&&(await u.isOwner())===false)setReadonly();}catch(e){}
})();
