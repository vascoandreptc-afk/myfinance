// Revolut EUR statement parser (pdf.js text content -> rows)
async function parseRevolutPDF(pdfjsLib, data){
  const doc=await pdfjsLib.getDocument({data,isEvalSupported:false}).promise;
  const MONTHS={janeiro:1,fevereiro:2,"março":3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
  const DATE=/\d{2}\/\d{2}\/\d{4}/g;
  const AMT=/(-?[\d\s\u00a0.]*\d,\d{2})\s*€/;
  const toNum=s=>{const m=String(s||"").match(AMT);if(!m)return null;return parseFloat(m[1].replace(/[\s\u00a0.]/g,"").replace(",","."));};
  const iso=d=>{const [a,b,c]=d.split("/");return c+"-"+b+"-"+a;};
  const DETAIL=/^(Para:|Cartão:|Referência:|Taxa |Purchase of|De:|Data de|Montante)/i;
  let section=null,period=null,cur=null,holder=null;const rows=[];const summary={};const allLines=[];
  for(let p=1;p<=doc.numPages;p++){
    const page=await doc.getPage(p);const vp=page.getViewport({scale:1});
    const sx=vp.width/827, H=vp.height;
    const tc=await page.getTextContent();
    const items=tc.items.filter(it=>it.str&&it.str.trim()).map(it=>({x:it.transform[4]/sx,top:(H-it.transform[5])/sx,s:it.str}));
    items.sort((a,b)=>a.top-b.top||a.x-b.x);
    const lines=[];
    for(const it of items){const l=lines.find(l=>Math.abs(l.top-it.top)<4);if(l)l.items.push(it);else lines.push({top:it.top,items:[it]});}
    lines.sort((a,b)=>a.top-b.top);
    for(const l of lines){
      l.items.sort((a,b)=>a.x-b.x);
      const text=l.items.map(i=>i.s).join(" ").replace(/\s+/g," ").trim();
      allLines.push(text);
      if(l.top<185||l.top>990)continue; // page header / footer
      if(p===1&&holder===null&&section===null){holder=text;continue;}
      if(/^Operações da conta de/.test(text)){section="conta";const m=text.match(/de (\d+) de (\S+) de (\d{4})/);if(m)period=m[3]+"-"+String(MONTHS[m[2].toLowerCase()]||0).padStart(2,"0");cur=null;continue;}
      if(/^(Transações de|Operações de Poupança|Operações de)/.test(text)&&!/da conta de/.test(text)){section="outra";cur=null;continue;}
      const sm=text.match(/^(Conta \(Conta Corrente\)|Cofres Pessoais e de Grupo|Poupança de Acesso Imediato|Total)\s+(.*)$/);
      if(sm&&section===null){const vals=(sm[2].match(/-?[\d\s\u00a0.]*\d,\d{2}€/g)||[]).map(toNum);if(vals.length>=4)summary[sm[1]]={inicial:vals[0],retirado:vals[1],recebido:vals[2],final:vals[3]};continue;}
      if(/Dinheiro retirado|Lançamento|contabilístico|^Data\b/.test(text))continue;
      if(section!=="conta")continue;
      const col={d:"",desc:"",ret:"",rec:"",saldo:""};
      for(const it of l.items){const x=it.x;
        if(x<225)col.d+=" "+it.s;else if(x<460)col.desc+=" "+it.s;else if(x<575)col.ret+=" "+it.s;else if(x<690)col.rec+=" "+it.s;else col.saldo+=" "+it.s;}
      const dates=col.d.match(DATE);
      if(dates){cur={data:iso(dates[0]),dataValor:dates[1]?iso(dates[1]):null,lines:[],ret:toNum(col.ret),rec:toNum(col.rec),saldo:toNum(col.saldo)};rows.push(cur);}
      else if(!cur)continue;
      const d=col.desc.trim();if(d)cur.lines.push(d);
      if(!dates){ if(cur.ret==null&&toNum(col.ret)!=null)cur.ret=toNum(col.ret); if(cur.rec==null&&toNum(col.rec)!=null)cur.rec=toNum(col.rec);}
    }
  }
  const out=rows.map(r=>{
    let title=[],detail=[],inDetail=false;
    for(const ln of r.lines){if(DETAIL.test(ln))inDetail=true;(inDetail?detail:title).push(ln);}
    const valor=r.rec!=null?r.rec:(r.ret!=null?-r.ret:0);
    return {data:r.data,dataValor:r.dataValor,descricao:title.join(" ").replace(/\s+/g," ").trim(),detalhe:detail.join(" · ").replace(/Cartão:\s*\S+/g,"").replace(/\s+·\s*$/,"").trim(),valor:Math.round(valor*100)/100,saldo:r.saldo};
  });
  return {period,holder,rows:out,summary};
}
if(typeof module!=="undefined")module.exports={parseRevolutPDF};

