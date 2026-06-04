# 📱 Equipe Tasks — Guia de Instalação

Siga os passos abaixo para colocar o app no ar em cerca de 15 minutos.

---

## Passo 1 — Criar o projeto no Firebase (banco de dados gratuito)

1. Acesse **https://console.firebase.google.com** com sua conta Google
2. Clique em **"Adicionar projeto"**
3. Dê um nome (ex: `equipe-tasks`) e clique em Continuar
4. Desative o Google Analytics (não precisa) → **Criar projeto**
5. No menu lateral, clique em **Realtime Database**
6. Clique em **"Criar banco de dados"**
7. Escolha a região **us-central1** → Avançar
8. Selecione **"Iniciar no modo de teste"** → Ativar
   _(você pode restringir depois quando quiser)_

---

## Passo 2 — Pegar as credenciais do Firebase

1. No menu lateral do Firebase, clique em ⚙️ **Configurações do projeto**
2. Role até **"Seus apps"** → clique no ícone `</>`  (Web)
3. Dê o nome `equipe-tasks-web` → **Registrar app**
4. Copie o bloco `firebaseConfig` que aparecer. Vai ser algo assim:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "equipe-tasks.firebaseapp.com",
  databaseURL: "https://equipe-tasks-default-rtdb.firebaseio.com",
  projectId: "equipe-tasks",
  storageBucket: "equipe-tasks.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Passo 3 — Configurar o app

Abra o arquivo **`js/config.js`** e:

1. **Substitua** o bloco `firebaseConfig` pelo que você copiou no Passo 2
2. **Preencha** a lista `TEAM_MEMBERS` com os nomes reais da sua equipe:

```js
const TEAM_MEMBERS = [
  { id: "membro1", name: "Maria Silva",   role: "Gestora",    color: "#e0e7ff", textColor: "#3730a3" },
  { id: "membro2", name: "João Pereira",  role: "Vendas",     color: "#fce7f3", textColor: "#9d174d" },
  { id: "membro3", name: "Ana Costa",     role: "Design",     color: "#dcfce7", textColor: "#166534" },
  // adicione mais ou remova conforme necessário
];
```

> ⚠️ Não mude os valores de `id` depois que o app estiver em uso — eles identificam cada pessoa no banco de dados.

---

## Passo 4 — Adicionar ícones do app

Na pasta `icons/`, coloque dois arquivos de imagem:
- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

Pode ser o logo da sua empresa ou qualquer imagem quadrada.
Use **https://favicon.io** para gerar os dois tamanhos rapidamente.

---

## Passo 5 — Publicar no Vercel (gratuito, 2 minutos)

1. Acesse **https://vercel.com** e entre com sua conta Google
2. Clique em **"Add New → Project"**
3. Escolha **"Deploy from your computer"** → arraste a pasta `equipe-tasks` inteira
   _(ou use o GitHub: suba os arquivos num repositório e conecte ao Vercel)_
4. Clique em **Deploy** — em segundos seu app estará no ar!
5. O Vercel vai te dar um link tipo: `https://equipe-tasks-xyz.vercel.app`

---

## Passo 6 — Distribuir para a equipe

Envie o link para cada membro da equipe pelo WhatsApp ou e-mail com a mensagem:

> "Acesse o link, escolha seu nome e instale o app: [SEU LINK]"

**No Android (Chrome):**
1. Abre o link no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. Confirma → aparece o ícone igual a um app

**No iPhone (Safari):**
1. Abre o link no Safari (obrigatório, não funciona no Chrome do iPhone)
2. Botão de compartilhar (□↑) → "Adicionar à Tela de Início"
3. Confirma → aparece o ícone

---

## ✅ Pronto!

A partir daqui, qualquer tarefa criada ou concluída por qualquer membro **aparece instantaneamente** nos celulares de todos.

---

## Dúvidas frequentes

**Posso adicionar mais membros depois?**
Sim! Basta editar `js/config.js`, adicionar a pessoa na lista e fazer o deploy novamente.

**O app funciona sem internet?**
Parcialmente — ele carrega sem internet, mas as atualizações em tempo real precisam de conexão.

**É seguro?**
Para uso interno de equipe sim. Se quiser adicionar senha/login, é possível ativar o Firebase Authentication — me peça e faço essa versão.

**Tem limite de uso gratuito?**
O Firebase gratuito suporta até 100 conexões simultâneas e 1GB de dados — mais do que suficiente para qualquer equipe pequena ou média.
