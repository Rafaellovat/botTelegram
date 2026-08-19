# 🤖 Bot Telegram — Lembretes com CRUD e Disparo Automático

Bot desenvolvido em TypeScript com Node.js, Prisma ORM e node-cron, com onboarding de consentimento (LGPD-like), CRUD completo de lembretes pessoais e notificação automática no horário agendado.

> 🚧 **Em desenvolvimento** — fluxo principal funcional (consentimento, cadastro de apelido, CRUD de lembretes, disparo automático). Próximas etapas: melhorias de UX, comando de admin, e novas funcionalidades.

## 💬 Testar o bot
[Conversar com o bot no Telegram](https://t.me/rafael_crm_bot)

## 🎯 Objetivo
Praticar arquitetura de bots com máquina de estados, autorização por dono do dado, agendamento de tarefas em background e boas práticas de proteção contra abuso (rate limiting, validação de entrada, limite de registros).

## ✨ Funcionalidades
- Onboarding com consentimento explícito de coleta de dados
- Cadastro de apelido com etapa de confirmação
- Cadastro de data de nascimento com confirmação e cálculo de idade
- Criação de lembretes com ou sem data/hora
- Disparo automático de lembretes no horário agendado (via cron, checagem a cada minuto)
- Listagem e exclusão de lembretes individuais
- Exclusão completa dos próprios dados (LGPD-like)
- Proteção contra spam: rate limiting, limite de caracteres e limite de registros por usuário

## 🛠️ Tecnologias
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![node-cron](https://img.shields.io/badge/node--cron-5C2D91?style=flat&logo=node.js&logoColor=white)

## 📂 Estrutura
- `src/bot.ts` — ponto de entrada, handlers de comando, botões e mensagens
- `src/prisma.ts` — instância do Prisma Client
- `src/estado.ts` — máquina de estados da conversa (controla o fluxo em múltiplas etapas)
- `src/teclados.ts` — teclados inline (botões) reutilizáveis
- `src/limites.ts` — validação de entrada e rate limiting
- `src/data.ts` — parsing e formatação de datas
- `src/agendador.ts` — cron de disparo automático de lembretes
- `prisma/schema.prisma` — modelagem do banco de dados

## ▶️ Como executar localmente
**Pré-requisito:** crie seu próprio bot conversando com o [@BotFather](https://t.me/BotFather) no Telegram (`/newbot`) para obter um token gratuito.

```bash
git clone https://github.com/Rafaellovat/botTelegram.git
cd botTelegram
npm install
npx prisma generate
npx prisma migrate dev
```

Crie um arquivo `.env` na raiz com:
DATABASE_URL="file:./dev.db"
TELEGRAM_BOT_TOKEN=seu_token_aqui

Depois, execute:
```bash
npx tsx src/bot.ts
```

## 📌 Contexto
Projeto pessoal desenvolvido para consolidar conhecimentos em automação, máquina de estados, integração de APIs, agendamento de tarefas e persistência de dados — parte do portfólio voltado a Desenvolvimento Backend.
