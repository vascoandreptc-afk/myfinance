/* ---------- PPR (extrato mensal Optimize): grupos no gráfico ---------- */
function pprGroups(){for(const id in st.ativos){const a=st.ativos[id];if(a.categoria!=="PPR")continue;const t=a.ticker||id;
  if(!GROUPS.some(g=>g[0]===t))GROUPS.push([t,(a.nome||t)+(a.titular?" · "+a.titular:""),"PPR",t]);}}
