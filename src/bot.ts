import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import prisma from './prisma.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN não encontrado no .env');
}

const bot = new TelegramBot(token, { polling: true });

console.log('Bot iniciado...');

// Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const from = msg.from;

  if (from) {
    await prisma.usuario.upsert({
      where: { telegramId: from.id },
      update: {}, // se já existe, só atualiza "ultimaVez" (automático via @updatedAt)
      create: {
        telegramId: from.id,
        firstName: from.first_name,
        username: from.username,
        languageCode: from.language_code,
      },
    });
  }

  bot.sendMessage(
    chatId,
    '🚧 Bot em construção. Em breve: cadastro e consulta de clientes.\n\n⚠️ No momento, este bot roda apenas localmente e pode não responder fora de horários de teste.\n\nℹ️ Este bot registra dados públicos do seu perfil do Telegram (ID, nome e username) para fins de teste e desenvolvimento.'
  );
});