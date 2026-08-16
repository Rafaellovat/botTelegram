# 🤖 Bot Telegram CRM

Bot de automação via Telegram, desenvolvido em TypeScript com Node.js e Prisma ORM, focado em CRUD empresarial (cadastro e consulta de clientes).

> 🚧 **Em desenvolvimento** — atualmente com estrutura inicial funcional. Próximas etapas: CRUD completo de clientes, controle de estoque e processamento de pedidos.

## 💬 Testar o bot

[Conversar com o bot no Telegram](https://t.me/rafael_crm_bot)

## 🎯 Objetivo

Automatizar o cadastro e consulta de clientes via chat, eliminando processos manuais e centralizando dados em banco relacional.

## 🛠️ Tecnologias

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

## 📂 Estrutura

- `src/bot.ts` — ponto de entrada, conexão com a API do Telegram
- `src/prisma.ts` — instância do Prisma Client
- `prisma/schema.prisma` — modelagem do banco de dados

## ▶️ Como executar localmente

**Pré-requisito:** crie seu próprio bot conversando com o [@BotFather](https://t.me/BotFather) no Telegram (`/newbot`) para obter um token gratuito.

\`\`\`bash
git clone https://github.com/Rafaellovat/botTelegram.git
cd botTelegram
npm install
npx prisma generate
npx prisma migrate dev
\`\`\`

Crie um arquivo `.env` na raiz com:
\`\`\`
DATABASE_URL="file:./dev.db"
TELEGRAM_BOT_TOKEN=seu_token_aqui
\`\`\`

Depois, execute:
\`\`\`bash
npx tsx src/bot.ts
\`\`\`

## 📌 Contexto

Projeto pessoal desenvolvido para consolidar conhecimentos em automação, integração de APIs e persistência de dados — parte do portfólio voltado a Desenvolvimento Backend.
