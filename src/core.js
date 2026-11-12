// Finance core: categories, default rules, categorisation
const CATS=[
  {n:"Supermercado",k:"despesa"},{n:"Restauração",k:"despesa"},{n:"Casa e serviços",k:"despesa"},{n:"Casa (conta conjunta)",k:"despesa"},
  {n:"Combustível",k:"despesa"},{n:"Transportes",k:"despesa"},{n:"Portagens",k:"despesa"},{n:"Subscrições",k:"despesa"},
  {n:"Compras",k:"despesa"},{n:"Vestuário",k:"despesa"},{n:"Saúde",k:"despesa"},{n:"Lazer e desporto",k:"despesa"},
  {n:"Viagens",k:"despesa"},{n:"Apostas",k:"despesa"},{n:"Transferências a pessoas",k:"despesa"},{n:"Levantamentos",k:"despesa"},{n:"Outros",k:"despesa"},
  {n:"Entradas",k:"entrada"},{n:"Poupança",k:"poupanca"},{n:"Poupança (via conta conjunta)",k:"poupanca"},{n:"Cofres (reservas)",k:"reserva"},{n:"Investimento",k:"investimento"},{n:"Transferência interna",k:"interna"}
];
const CAT_KIND=Object.fromEntries(CATS.map(c=>[c.n,c.k]));
const KINDS={despesa:"Despesa",entrada:"Entrada",poupanca:"Poupança",investimento:"Investimento",reserva:"Reserva (cofres)",interna:"Transferência interna"};
let CUSTOM_CATS=[];
function setCustomCats(l){CUSTOM_CATS=Array.isArray(l)?l.filter(c=>c&&c.n&&KINDS[c.k]&&!CAT_KIND[c.n]):[];}
function allCats(){return [...CATS.filter(c=>c.k==="despesa"),...CUSTOM_CATS.filter(c=>c.k==="despesa"),...CATS.filter(c=>c.k!=="despesa"),...CUSTOM_CATS.filter(c=>c.k!=="despesa")];}
function kindOf(n){if(CAT_KIND[n])return CAT_KIND[n];const c=CUSTOM_CATS.find(x=>x.n===n);return c?c.k:"despesa";}
const DEFAULT_RULES=[
  ["conversão cambial para btc","Investimento"],["sell of","Investimento"],["jp morgan","Investimento"],
  ["xtb spolka","Transferência interna"],["eur revolut x","Transferência interna"],
  ["carregamento de subconta","Cofres (reservas)"],["poupança de acesso imediato","Poupança","conjunta"],["conta reforçada","Cofres (reservas)"],
  ["from investment account","Transferência interna"],["ordem permanente intrabancária para ana cristina","Poupança (via conta conjunta)","pessoal",150],["ana cristina paula amaro","Casa (conta conjunta)","pessoal"],
  ["intrabancária de","Entradas","conjunta"],["carregamento com apple pay","Entradas"],["cashback","Entradas"],
  ["levantamento de numerário","Levantamentos"],["via verde","Portagens"],
  ["auchan energy","Combustível"],["galp","Combustível"],["repsol","Combustível"],["bp ","Combustível"],["prio","Combustível"],
  ["uber","Transportes"],["bolt","Transportes"],["parque","Transportes"],["v2m","Transportes"],["sixt","Transportes"],["inspama","Transportes"],["pa ranholas","Combustível"],
  ["pd 462","Supermercado"],["462 mem martins","Supermercado"],["pingo doce","Supermercado"],["continente","Supermercado"],["lidl","Supermercado"],["mercadona","Supermercado"],
  ["auchan","Supermercado"],["intermarch","Supermercado"],["sodimoso","Supermercado"],["recheio","Supermercado"],["estacao da fruta","Supermercado"],
  ["rio de mouro","Supermercado","conjunta"],["mem martins","Supermercado","conjunta"],
  ["starbucks","Restauração"],["burger king","Restauração"],["eurest","Restauração"],["incomum","Restauração"],["panialves","Restauração"],["mcdonald","Restauração"],
  ["pizza hut","Restauração"],["sr. prego","Restauração"],["forneria","Restauração"],["valverd","Restauração"],["queijadas","Restauração"],["bagga","Restauração"],
  ["zin vending","Restauração"],["jeronymo","Restauração"],
  ["amazon prime","Subscrições"],["spotify","Subscrições"],["anthropic","Subscrições"],["netflix","Subscrições"],["apple.com","Subscrições"],["patreon","Subscrições"],
  ["serv. municipa","Casa e serviços"],["ikea","Casa e serviços"],["leroy merlin","Casa e serviços"],["coolares","Casa e serviços"],["espaco casa","Casa e serviços"],
  ["zara","Vestuário"],["pull&bear","Vestuário"],["tezenis","Vestuário"],["lefties","Vestuário"],["primark","Vestuário"],["mango","Vestuário"],
  ["amazon","Compras"],["sp seure","Compras"],["joom","Compras"],["centro colombo","Compras"],["rituals","Compras"],["el corte ingl","Compras"],["dstore","Compras"],["action","Compras"],["pixelcorner","Compras"],
  ["betclic","Apostas"],["placard","Apostas"],["santa casa","Apostas"],
  ["padel","Lazer e desporto"],["sport zone","Lazer e desporto"],["decathlon","Lazer e desporto"],["fútbol emotion","Lazer e desporto"],["prozis","Lazer e desporto"],
  ["cintramedica","Saúde"],["farmácia","Saúde"],["farmacia","Saúde"],["hospital","Saúde"],["wells","Saúde"],
  ["transferência imediata","Transferências a pessoas"],["payment","Transferências a pessoas"]
];
function categorize(row,rules,conta){
  const hay=(row.descricao+" "+row.detalhe).toLowerCase();
  for(const r of rules){if(r.conta&&conta&&r.conta!==conta)continue;if(r.valor!=null&&Math.abs(Math.abs(row.valor)-Math.abs(+r.valor))>0.004)continue;if(r.contem&&hay.includes(r.contem.toLowerCase()))return r.categoria;}
  return row.valor>0?"Entradas":"Outros";
}
function rowId(r,seen){let s=r.data+"|"+(r.dataValor||"")+"|"+r.descricao+"|"+r.valor+"|"+r.saldo,h=5381;for(let k=0;k<s.length;k++)h=((h<<5)+h+s.charCodeAt(k))>>>0;const b=h.toString(36);seen[b]=(seen[b]||0)+1;return b+"-"+seen[b];}
function ruleList(arr){return arr.map(([contem,categoria,conta,valor])=>{const o={contem,categoria};if(conta)o.conta=conta;if(valor!=null)o.valor=valor;return o;});}
function guessConta(holder){const h=holder||"";return /&/.test(h)||h.trim().split(/\s+/).length>6?"conjunta":"pessoal";}
// Split parsed rows into months by value date (Revolut statements group by value date)
function splitMonths(parsed){const by={};for(const x of parsed.rows){const m=(x.dataValor||x.data).slice(0,7);(by[m]=by[m]||[]).push(x);}
  const out={};for(const m in by){const rows=by[m];const first=rows[0],last=rows[rows.length-1];
    out[m]={rows,abertura:first.saldo!=null?Math.round((first.saldo-first.valor)*100)/100:null,fecho:last.saldo};}
  return out;}
if(typeof module!=="undefined")module.exports={CATS,CAT_KIND,DEFAULT_RULES,categorize,rowId,ruleList,guessConta,splitMonths,kindOf,allCats,setCustomCats};

