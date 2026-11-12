const eur=new Intl.NumberFormat("pt-PT",{style:"currency",currency:"EUR"});
const eur0=new Intl.NumberFormat("pt-PT",{style:"currency",currency:"EUR",maximumFractionDigits:0});
const pct=new Intl.NumberFormat("pt-PT",{style:"percent",minimumFractionDigits:1,maximumFractionDigits:1});
const $=id=>document.getElementById(id);
const INV_COLOR={"Cripto":"var(--c-cripto)","ETF Core":"var(--c-core)","ETF Agressivo":"var(--c-agr)","XTB Manual":"var(--c-man)","PPR":"var(--c-ppr)"};
const INV_ORDER=["Cripto","ETF Core","ETF Agressivo","XTB Manual","PPR"];
const SLUG={"Cripto":"cri","ETF Core":"core","ETF Agressivo":"agr","XTB Manual":"man","PPR":"ppr"};
function akey(cat,t){return cat+"~"+t;}
function ativosByKey(){const m={};for(const id in st.ativos){const d=st.ativos[id];m[akey(d.categoria||"Cripto",d.ticker||id)]={id,doc:d};}return m;}
const MES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DAY=86400000;
const st={lotes:[],ativos:{},real:[],meses:{},regras:null,regrasVer:false,filter:"all",editing:null,db:null,
  loaded:{},readonly:false,mes:null,ano:null,conta:"pessoal",catFilter:"",q:"",pending:null};

function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function parseD(s){if(!s)return null;const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d);}
function addYear(s){const [y,m,d]=s.split("-").map(Number);return Date.UTC(y+1,m-1,d);}
function fmtD(ms){return new Date(ms).toLocaleDateString("pt-PT",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric"});}
function fmtDs(s){return new Date(parseD(s)).toLocaleDateString("pt-PT",{timeZone:"UTC",day:"2-digit",month:"short"});}
function mesLabel(m){const [y,mm]=m.split("-");return MES[+mm-1]+" "+y;}
function signed(v){return (v>0?"+":"")+eur.format(v);}
function cls(v){return v>0.005?"pos":v<-0.005?"neg":"";}
function tick(s){return String(s||"").trim().toUpperCase().replace(/[^A-Z0-9._-]/g,"");}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function r2(v){return Math.round(v*100)/100;}
function rules(){return st.regras||ruleList(DEFAULT_RULES);}
const CONTA_LABEL={pessoal:"Pessoal",conjunta:"Conjunta"};
function mdoc(m){return st.meses[st.conta+"-"+m];}
function setStatus(t){$("status").textContent=t;}

