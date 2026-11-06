# MyFinance

App web (PWA) para as finanças da casa: extratos da Revolut (pessoal e conjunta), orçamentos, plano anual, poupança e investimentos (XTB e cripto). Os dados ficam no Firebase e só as contas autorizadas os conseguem ler.

Este repositório tem apenas o código. **Nunca carregues aqui extratos nem a cópia de segurança (.json)** — o repositório é público.

## Configuração (uma única vez, ~25 minutos, no Mac)

Os nomes dos botões nas consolas podem variar ligeiramente.

### 1. Firebase (dados e login)
1. Abre https://console.firebase.google.com com a conta **vasco.andreptc@gmail.com** e cria um projeto (ex.: `financas-casa`). Podes desligar o Google Analytics.
2. **Authentication** → Começar → separador *Método de início de sessão* → **Email/palavra-passe** → Ativar → Guardar.
3. **Authentication** → separador *Utilizadores* → **Adicionar utilizador**: cria a tua conta (o teu email + palavra-passe) e a da tua esposa (o email dela + uma palavra-passe provisória — ela pode mudá-la no ecrã de login em "Esqueci-me da palavra-passe").
4. Na lista de utilizadores, copia o **UID** de cada um (coluna "UID do utilizador").
5. **Firestore Database** → Criar base de dados → localização na Europa (ex.: `europe-southwest1` Madrid ou `eur3`) → **modo de produção**.
6. No separador **Regras** do Firestore, apaga o que lá está e cola o conteúdo do ficheiro `firestore.rules` deste repositório, substituindo `UID_VASCO` e `UID_ESPOSA` pelos dois UIDs. Clica **Publicar**.
7. Engrenagem ⚙️ → **Definições do projeto** → secção *As tuas apps* → ícone **Web `</>`** → dá o nome "MyFinance" (não ativar Hosting) → Registar. Aparece um bloco `firebaseConfig = { apiKey: ..., ... }` — deixa esta página aberta.

### 2. GitHub (alojar a app)
1. Cria conta em https://github.com (gratuita).
2. **New repository** → nome `myfinance` → **Public** → Create.
3. No repositório: **Add file → Upload files** e arrasta **todos os ficheiros e a pasta `icons`** deste pacote → **Commit changes**.
4. Abre o ficheiro `firebase-config.js` no GitHub → ícone do lápis ✏️ → substitui os valores `COLA_AQUI` pelos do bloco `firebaseConfig` do passo 1.7 → **Commit changes**.
5. **Settings → Pages** → *Source*: Deploy from a branch → Branch **main**, pasta **/ (root)** → Save. Ao fim de 1–2 minutos a app fica em `https://<o-teu-utilizador>.github.io/myfinance/`.

### 3. Autorizar o endereço no Firebase
Firebase → **Authentication → Definições → Domínios autorizados → Adicionar domínio** → `<o-teu-utilizador>.github.io`.

### 4. Primeiro arranque
1. No Mac, abre `https://<o-teu-utilizador>.github.io/myfinance/` e entra com o teu email.
2. Em *Finanças do mês* → **Cópia de segurança → Importar cópia…** → escolhe `myfinance-copia-2026-11-06.json` → **Importar cópia**. Ficam lá todos os dados atuais.
3. No iPhone (Safari): abre o mesmo endereço → entra → **Partilhar → Adicionar ao ecrã principal**. A tua esposa faz o mesmo com a conta dela.
4. No Mac (Safari): **Ficheiro → Adicionar ao Dock** para teres a app no Dock.

## Atualizações
Liga o GitHub ao Claude (definições do claude.ai) e dá acesso ao repositório `myfinance`: o Claude passa a publicar as alterações diretamente. Sem isso, cada nova versão chega como ficheiros para carregares em *Add file → Upload files*.

## Segurança
- A configuração do Firebase (`firebase-config.js`) não é secreta; o que protege os dados são as regras do Firestore, que só deixam entrar os dois UIDs.
- Usa palavras-passe fortes e, se quiseres, ativa a verificação em dois passos na conta Google.
- Descarrega uma cópia de segurança de vez em quando (botão *Descarregar cópia*) e guarda-a no iCloud Drive — nunca no GitHub.
