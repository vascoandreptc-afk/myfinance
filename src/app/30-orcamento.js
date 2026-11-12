/* ================= ORÇAMENTOS ================= */
st.orcConta="pessoal";st.orcMes=null;st.orc=null;st.orcDraft=null;
function budgetFor(conta,ano){const p=ano&&st.planos&&st.planos[ano]&&st.planos[ano][conta];if(p&&p.cats&&Object.keys(p.cats).length)return p.cats;return (st.orc&&st.orc[conta])||{};}
function usingPlan(conta,ano){const p=ano&&st.planos&&st.planos[ano]&&st.planos[ano][conta];return !!(p&&p.cats&&Object.keys(p.cats).length);}
function renderOrc(){
  const conta=st.orcConta;const ms=monthsOf(conta);const sel=$("orc-mes");
  if(!st.orcMes||!ms.includes(st.orcMes)){const full=ms.filter(x=>!isPartial(x));st.orcMes=full[full.length-1]||ms[ms.length-1]||null;}
  sel.innerHTML=ms.length?ms.slice().reverse().map(m=>'<option value="'+m+'"'+(m===st.orcMes?" selected":"")+'>'+mesLabel(m)+(isPartial(m)?" (em curso)":"")+'</option>').join(""):'<option>Sem extratos</option>';
  sel.disabled=!ms.length;
  const orcAno=(st.orcMes||curMonth()).slice(0,4);const bud=st.orcDraft||budgetFor(conta,orcAno);const m=st.orcMes;const s=m?statsFor(conta,m):null;
  const full=ms.filter(x=>!isPartial(x));const year=(m||curMonth()).slice(0,4);const ytd=full.filter(x=>x.slice(0,4)===year&&(!m||x<=m));
  const totB=Object.values(bud).reduce((a,b)=>a+(+b||0),0);
  let gastoB=0,exc=0;const tb=$("t-orc");tb.innerHTML="";
  const last3=full.filter(x=>!m||x<=m).slice(-3);const avg={};
  for(const x of last3){const sx=statsFor(conta,x);for(const c in sx.cats)avg[c]=(avg[c]||0)+sx.cats[c]/last3.length;}
  const catsShown=allCats().filter(c=>c.k==="despesa").map(c=>c.n).filter(c=>(+bud[c]>0)||Math.abs(avg[c]||0)>0.004);
  let okMonths=0,totMonths=0;
  for(const c of catsShown){const b=+bud[c]||0;const g=avg[c]||0;if(b>0){gastoB+=g;if(g>b+0.005)exc++;}
    let inM=0,yG=0;for(const x of ytd){const sx=statsFor(conta,x);const gx=sx.cats[c]||0;yG+=gx;if(b>0&&gx<=b+0.005)inM++;}
    if(b>0){okMonths+=inM;totMonths+=ytd.length;}
    const ratio=b>0?g/b:null;const col=ratio==null?"var(--muted)":ratio>1?"var(--neg)":ratio>0.85?"var(--warn)":"var(--pos)";
    const chip=b>0?(ratio>1?'<span class="chip miss">excedido</span>':ratio>0.85?'<span class="chip wait">perto do limite</span>':'<span class="chip ok">dentro</span>'):'<span class="chip na">sem orçamento</span>';
    const tr=document.createElement("tr");
    tr.innerHTML='<td>'+esc(c)+'</td><td class="r num">'+(b>0?eur0.format(b):'<span class="muted">—</span>')+'</td>'+
      '<td class="r num">'+eur.format(g)+'</td><td class="r num '+(b>0?cls(b-g):"")+'">'+(b>0?eur.format(b-g):"—")+'</td>'+
      '<td><span class="pbar"><span style="width:'+(ratio==null?0:Math.min(100,ratio*100)).toFixed(0)+'%;background:'+col+'"></span></span> '+chip+'</td>'+
      '<td class="r num">'+(b>0&&ytd.length?inM+"/"+ytd.length+' meses<div class="note">'+eur0.format(yG)+' de '+eur0.format(b*ytd.length)+'</div>':'<span class="muted">—</span>')+'</td>';
    tb.appendChild(tr);
  }
  const set=(id,v,sub,c)=>{$(id).textContent=v;$(id).className="big "+(c||"");$(id+"-sub").textContent=sub||" ";};
  set("o-tot",totB?eur.format(totB):"—",totB?Object.keys(bud).length+" categorias":"Define o orçamento de "+orcAno+" na vista Ano");
  $("orc-empty").hidden=!!totB;$("orc-empty-ano").textContent=orcAno;
  const gShow=totB?gastoB:Object.values(avg).reduce((x,y)=>x+y,0);
  set("o-gasto",last3.length?eur.format(gShow):"—",last3.length?"média de "+last3.map(mShort).join(", "):"");
  set("o-rest",totB?eur.format(totB-gastoB):"—",exc?exc+" categoria"+(exc>1?"s":"")+" excedida"+(exc>1?"s":""):"nenhuma categoria excedida",totB?cls(totB-gastoB):"");
  set("o-ano",totMonths?pct.format(okMonths/totMonths):"—",totMonths?okMonths+" de "+totMonths+" categoria-mês dentro do orçamento":"precisa de orçamento definido");
  $("orc-note").textContent=(usingPlan(conta,orcAno)?"A usar o Plano "+orcAno+" · ":"")+(s?"Despesas do mês: "+eur.format(s.despesas):"");
}
$("orc-conta").addEventListener("click",e=>{const b=e.target.closest("button[data-c]");if(!b)return;st.orcConta=b.dataset.c;st.orcDraft=null;$("orc-msg").textContent="";
  for(const x of $("orc-conta").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));renderOrc();});
document.addEventListener("click",e=>{const b=e.target.closest(".orc-modo button[data-v]");if(b){if(b.dataset.v==="plano"&&st.orcMes){st.plAno=st.orcMes.slice(0,4);st.plConta=st.orcConta;for(const x of $("pl-conta").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x.dataset.c===st.plConta));renderPlano();}
  if(b.dataset.v==="orcamentos"){st.orcConta=st.plConta;for(const x of $("orc-conta").querySelectorAll("button"))x.setAttribute("aria-pressed",String(x.dataset.c===st.orcConta));renderOrc();}location.hash=b.dataset.v;}});
$("orc-mes").addEventListener("change",e=>{st.orcMes=e.target.value;renderOrc();});
$("orc-sug").addEventListener("click",()=>{const conta=st.orcConta;const full=monthsOf(conta).filter(m=>!isPartial(m)).slice(-3);
  if(!full.length){$("orc-msg").textContent="Importa pelo menos um mês completo.";return;}
  const sum={};for(const m of full){const s=statsFor(conta,m);for(const c in s.cats)sum[c]=(sum[c]||0)+s.cats[c];}
  const d={};for(const c in sum){const v=Math.ceil(sum[c]/full.length/5)*5;if(v>0)d[c]=v;}
  st.orcDraft=d;$("orc-msg").textContent="Sugestão pela média de "+full.map(mShort).join(", ")+", arredondada a 5 €. Ajusta e guarda.";renderOrc();});
$("orc-save").addEventListener("click",async()=>{if(!st.db)return;const conta=st.orcConta;const ano=(st.orcMes||curMonth()).slice(0,4);const d=st.orcDraft||budgetFor(conta,ano);
  if(usingPlan(conta,ano)){const pd=JSON.parse(JSON.stringify(st.planos[ano]));pd[conta].cats=d;try{await st.db.collection("planos").doc(ano).set(pd);st.orcDraft=null;$("orc-msg").textContent="Plano "+ano+" atualizado.";}catch(e){$("orc-msg").textContent="Não foi possível guardar.";}return;}
  const all={...(st.orc||{}),[conta]:d};
  try{await st.db.collection("config").doc("orcamentos").set(all);st.orcDraft=null;$("orc-msg").textContent="Orçamento guardado.";}catch(e){$("orc-msg").textContent="Não foi possível guardar o orçamento.";}});

