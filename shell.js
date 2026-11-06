/* Ligação ao Firebase: login, base de dados e cópia de segurança.
   Expõe window.claude.use("db") com a mesma interface que a app já usa. */
(function(){
  const cfg=window.FIREBASE_CONFIG||{};
  const $=id=>document.getElementById(id);
  const gate=$("gate"),form=$("login-form"),msg=$("login-msg");
  const configured=cfg.apiKey&&!/COLA_AQUI/.test(cfg.apiKey);
  let resolveDb;const dbReady=new Promise(r=>{resolveDb=r;});
  window.claude={use:async n=>n==="db"?dbReady:n==="user"?{isOwner:async()=>true,canEdit:async()=>true}:null};
  if(!configured){gate.hidden=false;form.hidden=true;msg.textContent="A app ainda não está ligada ao Firebase. Preenche o ficheiro firebase-config.js (ver o guia).";return;}
  firebase.initializeApp(cfg);
  const auth=firebase.auth();const db=firebase.firestore();
  let lp=false;try{lp=localStorage.getItem("mf-lp")==="1";}catch(e){}
  try{db.settings(lp?{ignoreUndefinedProperties:true,experimentalForceLongPolling:true,experimentalAutoDetectLongPolling:false}:{ignoreUndefinedProperties:true,experimentalAutoDetectLongPolling:true});}
  catch(e){lp=false;try{localStorage.removeItem("mf-lp");}catch(_){}try{db.settings({ignoreUndefinedProperties:true});}catch(_){}}
  window.__mfLongPolling=lp;
  db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  let started=false;
  auth.onAuthStateChanged(u=>{
    if(u){gate.hidden=true;$("who").textContent=u.email;$("acct").hidden=false;if(!started){started=true;resolveDb(db);}}
    else{if(started){location.reload();return;}gate.hidden=false;$("acct").hidden=true;setTimeout(()=>$("login-email").focus(),50);}
  });
  form.addEventListener("submit",async e=>{e.preventDefault();msg.textContent="A entrar…";const b=$("login-go");b.disabled=true;
    try{await auth.signInWithEmailAndPassword($("login-email").value.trim(),$("login-pass").value);msg.textContent="";}
    catch(err){msg.textContent=/wrong-password|invalid-credential|user-not-found|invalid-login/.test(err.code||"")?"Email ou palavra-passe incorretos.":err.code==="auth/too-many-requests"?"Demasiadas tentativas. Espera uns minutos ou repõe a palavra-passe.":err.code==="auth/network-request-failed"?"Sem ligação à internet.":"Não foi possível entrar ("+(err.code||"erro")+").";}
    finally{b.disabled=false;}});
  $("login-reset").addEventListener("click",async()=>{const em=$("login-email").value.trim();if(!em){msg.textContent="Escreve o teu email e toca outra vez em “Esqueci-me da palavra-passe”.";return;}
    try{await auth.sendPasswordResetEmail(em);msg.textContent="Enviámos um email para "+em+" com um link para definir nova palavra-passe.";}catch(err){msg.textContent="Não foi possível enviar o email. Confirma o endereço.";}});
  $("logout").addEventListener("click",()=>auth.signOut());

  /* ---- cópia de segurança ---- */
  const COLS=["meses","lotes","ativos","realizados","config","historico","planos"];
  $("bk-export").addEventListener("click",async()=>{const m=$("bk-msg");m.textContent="A preparar…";
    try{const out={app:"myfinance",versao:1,exportado:new Date().toISOString().slice(0,10),colecoes:{}};
      for(const c of COLS){const s=await db.collection(c).get();out.colecoes[c]={};s.forEach(d=>{out.colecoes[c][d.id]=d.data();});}
      const blob=new Blob([JSON.stringify(out)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="myfinance-copia-"+out.exportado+".json";document.body.appendChild(a);a.click();a.remove();
      m.textContent="Cópia descarregada.";}catch(e){m.textContent="Não foi possível exportar.";}});
  $("bk-file").addEventListener("change",async e=>{const f=e.target.files[0];const m=$("bk-msg");if(!f)return;
    try{const j=JSON.parse(await f.text());if(!["myfinance","livro-investimentos"].includes(j.app)||!j.colecoes)throw 0;
      const n=Object.values(j.colecoes).reduce((a,c)=>a+Object.keys(c).length,0);
      m.innerHTML="";const p=document.createElement("span");p.textContent="Cópia de "+(j.exportado||"?")+" com "+n+" registos. Substitui os registos com o mesmo nome. ";
      const go=document.createElement("button");go.type="button";go.className="btn";go.textContent="Importar cópia";m.append(p,go);
      go.addEventListener("click",async()=>{go.disabled=true;go.textContent="A importar…";
        try{let batch=db.batch(),k=0,done=0;
          for(const c in j.colecoes)for(const id in j.colecoes[c]){batch.set(db.collection(c).doc(id),j.colecoes[c][id]);k++;if(k===400){await batch.commit();done+=k;batch=db.batch();k=0;}}
          if(k)await batch.commit();done+=k;m.textContent="Importados "+done+" registos.";e.target.value="";}
        catch(err){m.textContent="A importação falhou ("+(err.code||"erro")+"). Confirma as regras do Firestore no guia.";}});
    }catch(err){m.textContent="Este ficheiro não é uma cópia de segurança desta app.";}});

  /* ---- service worker (ícone, arranque rápido, modo offline) ---- */
  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
})();
