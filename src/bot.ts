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
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '🚧 Bot em construção. Em breve: cadastro e consulta de clientes.'
  );
});