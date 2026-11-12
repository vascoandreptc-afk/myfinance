// Firebase compat stand-in for local testing (in-memory store, same call shapes)
(function(){
  const store={};const subs=[];let user=null;const authCbs=[];
  const clone=o=>JSON.parse(JSON.stringify(o));
  const snapDoc=(id,d)=>({id,exists:d!==undefined,data:()=>d===undefined?undefined:clone(d),metadata:{fromCache:false,hasPendingWrites:false}});
  function notify(){for(const s of subs)s();}
  function colSnap(c){const docs=Object.entries(store[c]||{}).map(([i,d])=>snapDoc(i,d));return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f),metadata:{fromCache:false}};}
  function ref(c,id){return {id,path:c+"/"+id,
    set:async d=>{if(!user)throw {code:"permission-denied"};(store[c]=store[c]||{})[id]=clone(JSON.parse(JSON.stringify(d)));window.__writes=(window.__writes||0)+1;notify();},
    update:async d=>{if(!store[c]||!store[c][id])throw {code:"not-found"};Object.assign(store[c][id],clone(d));notify();},
    delete:async()=>{if(store[c])delete store[c][id];notify();},
    get:async()=>snapDoc(id,(store[c]||{})[id]),
    onSnapshot:(n,e)=>{const f=()=>n(snapDoc(id,(store[c]||{})[id]));subs.push(f);setTimeout(f,5);return()=>{}}};}
  const db={settings(){},enablePersistence:()=>Promise.resolve(),
    collection:c=>({doc:id=>ref(c,id||Math.random().toString(36).slice(2)),add:async d=>{const r=ref(c,Math.random().toString(36).slice(2));await r.set(d);return r;},
      get:async()=>colSnap(c),onSnapshot:(n,e)=>{const f=()=>n(colSnap(c));subs.push(f);setTimeout(f,5);return()=>{}}}),
    doc:p=>{const [c,i]=p.split("/");return ref(c,i);},
    batch:()=>{const ops=[];return {set:(r,d)=>ops.push([r,d]),commit:async()=>{for(const [r,d] of ops)await r.set(d);}};}};
  const auth={onAuthStateChanged:cb=>{authCbs.push(cb);setTimeout(()=>cb(user),5);},
    signInWithEmailAndPassword:async(e,p)=>{if(p!=="segredo123")throw {code:"auth/invalid-credential"};user={uid:"u1",email:e};authCbs.forEach(cb=>cb(user));},
    sendPasswordResetEmail:async()=>{},signOut:async()=>{user=null;authCbs.forEach(cb=>cb(null));}};
  window.firebase={initializeApp(){},auth:()=>auth,firestore:()=>db};
  window.__store=store;
})();
