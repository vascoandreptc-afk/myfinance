# MyFinance — contexto para o Claude

App pessoal de finanças do Vasco (e da mulher, com acesso total). PWA em GitHub Pages:
https://vascoandreptc-afk.github.io/myfinance/ · Português de Portugal em toda a interface e mensagens.

## Arquitetura
- **Sem framework.** `index.html` (HTML + CSS), `shell.js` (Firebase: login, persistência, cópia de segurança, service worker),
  `app.js` (**gerado**: não editar à mão), `sw.js`, `firebase-config.js` (config pública do Firebase, não é segredo).
- **Código-fonte em `src/`** → `node build.js` junta tudo no `app.js` (ordem: `core.js`, `revolut-pdf.js`, `importadores.js`,
  depois `src/app/*.js` por ordem alfabética, dentro de um único `(function(){ … })()`).
  - `src/core.js` — categorias, regras por omissão, `categorize`, `splitMonths` (também usado em Node).
  - `src/revolut-pdf.js` — leitor do extrato EUR da Revolut (pdf.js).
  - `src/importadores.js` — `mfImportadores(st, {hoje})`: leitores e importadores da XTB (xlsx), cripto Revolut (PDF) e
    Optimize/PPR (PDF). É partilhado com as tarefas automáticas do repositório privado `myfinance-sync`.
    `st.db` só precisa de `collection().doc().set()/delete()` (Firestore compat no browser, firebase-admin em Node).
  - `src/app/NN-*.js` — interface por área (finanças, orçamento, poupança, investimentos, telemóvel, …).
- **Dados: Firestore** (projeto do Vasco). Coleções: `meses` (id `<conta>-AAAA-MM`, conta pessoal|conjunta, `movimentos[]`),
  `lotes`, `ativos`, `realizados`, `config/{regras,categorias,orcamentos,objetivos}`, `historico/carteira`
  (`grupos.<grupo>.<AAAA-MM> = {v valor, a aportes, c custo PPR, est, parcial}`), `planos/<ano>` ({pessoal|conjunta:{cats,linhas}}),
  `sync/revolut`. Regras de segurança em `firestore.rules` (só os 2 utilizadores).
- **Telemóvel (≤760 px)**: modo de consulta (`body.m-mode`, `src/app/70-mobile.js`). Mac/iPad: versão completa.

## Regras de negócio que o Vasco definiu
- **Poupança** = só a transferência mensal de 150 € da conta pessoal para a conjunta, a passagem da conjunta para a
  "Poupança de Acesso Imediato" e movimentos categorizados à mão como Poupança. **Investimentos não são poupança.**
  Cofres da Revolut = "Cofres (reservas)", fora das contas.
- Orçamento: um só separador com vistas **Mês** (acompanhar, só leitura) e **Ano** (definir, em `planos/<ano>`).
  "Gasto" na vista Mês = média dos últimos 3 meses completos. Página principal: despesas vs orçamento por categoria.
- Cripto: isenção de IRS após 365 dias (contagem por lote). PPR Optimize: entregas = diferença do custo total mês a mês
  (funciona com extratos importados em qualquer ordem — houve um erro de −40% por causa disto; há teste).
- Rentabilidade mensal pelo método de Dietz, acumulada encadeada.

## Fluxo de trabalho
1. Editar em `src/` (ou `index.html`/`shell.js`), correr `node build.js`.
2. `npm test` (leitores com extratos fictícios + app.js atualizado) e `npm run test:ui` (Chromium: Mac e iPhone).
3. **Subir a versão** a cada publicação: `?v=N` em `index.html` (3 scripts) e `myfinance-vN` + `?v=N` em `sw.js`.
4. Push para `main` publica (GitHub Pages). O workflow "Testes" corre em cada push.
- **Nunca** pôr extratos, cópias de segurança (`myfinance-copia-*.json`) ou dados reais neste repositório: é **público**.
  Os testes usam só extratos fictícios gerados em `tests/fixtures.js`.

## Repositório privado `myfinance-sync` (GitHub Actions)
- "Sincronizar Revolut" de 4 em 4 h via Enable Banking (PSD2, só leitura): contas pessoal (…5731) e conjunta (…7083).
  Autorização válida até ~maio de 2027: renovar com "1 · Autorizar Revolut" e "2 · Concluir autorização" (código).
- "Atualizar investimentos" (6h37 e 18h37 UTC, `src/investimentos.js`), cada passo só corre se tiver os segredos:
  - **email** (`GMAIL_USER`, `GMAIL_APP_PASSWORD`): caixa Gmail dedicada que recebe, por reencaminhamento, os emails da
    XTB e da Optimize; lê os anexos por IMAP e importa-os com `src/importadores.js` deste repositório (checkout em `./app`).
    Anexos não reconhecidos ficam em `sync/email.desconhecidos` (amostra de texto) para se escrever o leitor.
    A XTB envia por email a **confirmação das ordens executadas** (PDF com palavra-passe → segredo `XTB_PDF_PASSWORD`):
    compras exatas por ETF + valor da conta, mas não o valor por posição. Vira lotes `origem:"xtb-conf"`; o Excel da XTB
    seguinte apaga-os (já os inclui). Na app, o import pede a palavra-passe e não a guarda.
  - **cripto** (`REVX_API_KEY`, `REVX_PRIVATE_KEY` Ed25519): API só de leitura da Revolut X — saldo unificado com a app
    principal (inclui Trocos), transações (lotes `origem:"revx"`) e fecho mensal por velas diárias. Começa em `sync/revx.inicio`.
  - **xtb**: estimativa entre extratos — unidades do último Excel + compras confirmadas (`xtb-conf`) + depósitos "JP Morgan"
    ainda sem confirmação, vistos na conta pessoal,
    repartidos pelos planos (aportes do último mês) e ETF (peso no valor), cotações do Yahoo. Escreve `valorEstimado`/
    `estimadoEm` nos ativos (a app usa-os só se forem mais recentes do que `atualizado`), lotes `origem:"xtb-est"` e meses
    `est:true` no histórico. O extrato real apaga tudo isto.
  - Estado de cada passo em `sync/investimentos` (mostrado nas Definições).
- Segredos só em GitHub Secrets (nunca pedir nem mostrar): `EB_PRIVATE_KEY`, `FIREBASE_SERVICE_ACCOUNT` e os das
  importações automáticas. A XTB fechou a API em março de 2025.
