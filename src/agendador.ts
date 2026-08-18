import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import prisma from './prisma.js';

// Roda a cada minuto: procura lembretes com dataHora <= agora que ainda não foram
// enviados, dispara a mensagem, e marca como enviado (pra nunca repetir o aviso).
export function iniciarAgendadorDeLembretes(bot: TelegramBot) {
  cron.schedule('* * * * *', async () => {
    const agora = new Date();

    const lembretesPendentes = await prisma.lembrete.findMany({
      where: {
        enviado: false,
        dataHora: { lte: agora },
      },
      include: { usuario: true },
    });

    for (const lembrete of lembretesPendentes) {
      try {
        await bot.sendMessage(
          Number(lembrete.usuario.telegramId),
          `⏰ Lembrete: ${lembrete.texto}`
        );
        await prisma.lembrete.update({
          where: { id: lembrete.id },
          data: { enviado: true },
        });
      } catch (erro) {
        console.error(`Erro ao enviar lembrete ${lembrete.id}:`, erro);
        await prisma.lembrete.update({
          where: { id: lembrete.id },
          data: { enviado: true },
        });
      }
    }
  });

  console.log('Agendador de lembretes iniciado (checagem a cada minuto).');
}