import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import prisma from './prisma.js';
import { Estado, definirEstado, obterEstado, limparEstado } from './estado.js';
import {
  tecladoConsentimento,
  tecladoConfirmarApelido,
  tecladoConfirmarNascimento,
  tecladoMenu,
  tecladoVoltarMenu,
  tecladoConLembreteData,
  tecladoConfirmarApagarTudo,
} from './teclados.js';
import { LIMITES, textoValido, excedeuRateLimit } from './limites.js';
import { parseDataHora, dataEhFutura, formatarDataHora } from './data.js';
import { iniciarAgendadorDeLembretes } from './agendador.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN não encontrado no .env');
}

export const bot = new TelegramBot(token, { polling: true });

console.log('Bot iniciado...');

// Texto legal/LGPD completo. Não aparece mais toda hora no menu — só quando
// a pessoa clica em "Mais informações", pra não ficar agressivo/repetitivo.
const AVISO_ACADEMICO =
  'Esta mensagem é automática. Este bot foi feito por Rafael L Lovat para fins unicamente acadêmicos.\n' +
  '⚠️ Por motivos de segurança, NUNCA passe nenhum dado real. JAMAIS INFORME CPF, senhas, endereços, e outros dados sensíveis.!';

// Calcula a idade a partir da data de nascimento, sempre "ao vivo" (nunca
// guardamos idade pronta no banco, porque ela muda todo ano sozinha).
function calcularIdade(nascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const aniversarioJaPassouEsseAno =
    hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());

  if (!aniversarioJaPassouEsseAno) idade--;

  return idade;
}

// Envia o menu principal. O menu é montado na hora (função tecladoMenu),
// porque o botão de "data de nascimento" só deve aparecer se ainda não foi cadastrada.
async function enviarMenuPrincipal(chatId: number, apelido: string, temDataNascimento: boolean) {
  await bot.sendMessage(
    chatId,
    `Olá, ${apelido}! 👋 O que deseja fazer?`,
    tecladoMenu(temDataNascimento)
  );
}

// ============================================================
// /start — primeira entrada do usuário, ou reabertura do menu
// ============================================================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const from = msg.from;
  if (!from) return;

  const usuario = await prisma.usuario.findUnique({ where: { telegramId: from.id } });

  // Usuário já existe no banco: só reabre o menu (e reseta qualquer fluxo pendente)
  if (usuario) {
    limparEstado(chatId);
    await enviarMenuPrincipal(chatId, usuario.apelido, !!usuario.dataNascimento);
    return;
  }

  // Primeira mensagem: enviada quando o /start é de um chatId novo (ainda não cadastrado no banco)
  await bot.sendMessage(
    chatId,
    'Oi! Eu sou o Lino, seu bot de lembretes 🔔\n\n' +
      '⚠️ Antes de continuar: as notificações desse chat costumam vir desativadas por padrão. ' +
      'Ative nas configurações do chat (ícone de sino no topo da conversa) pra garantir que meus lembretes cheguem até você.\n\n' +
      'Vi que é a sua primeira vez por aqui.\n\n' +
      'Ao continuar, você autoriza o compartilhamento de alguns dados públicos (como seu @ do Telegram) ' +
      'para fins unicamente acadêmicos.',
    tecladoConsentimento
  );
});

// ============================================================
// Botões (callback_query) — tudo que é clique de botão inline
// ============================================================
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  const from = query.from;
  if (!chatId || !from) return;

  const data = query.data;
  await bot.answerCallbackQuery(query.id); // tira o "relógio" de carregando do botão

  switch (data) {
    // ---------- Onboarding: consentimento ----------
    case 'consentimento_recusar': {
      await bot.sendMessage(chatId, 'Tudo bem, nenhum dado foi salvo. Se mudar de ideia, é só mandar /start de novo.');
      limparEstado(chatId);
      break;
    }

    case 'consentimento_continuar': {
      definirEstado(chatId, Estado.AGUARDANDO_APELIDO);
      await bot.sendMessage(chatId, 'Como devo te chamar?');
      break;
    }

    // ---------- Onboarding: apelido ----------
    case 'apelido_editar': {
      definirEstado(chatId, Estado.AGUARDANDO_APELIDO);
      await bot.sendMessage(chatId, 'Sem problema, como devo te chamar?');
      break;
    }

    case 'apelido_confirmar': {
      const contexto = obterEstado(chatId);
      const apelido = contexto?.dados?.apelido as string | undefined;
      if (!apelido) {
        await bot.sendMessage(chatId, 'Algo deu errado, vamos recomeçar. Manda /start de novo.');
        limparEstado(chatId);
        break;
      }

      const usuario = await prisma.usuario.upsert({
        where: { telegramId: from.id },
        update: { username: from.username, apelido },
        create: { telegramId: from.id, username: from.username, apelido },
      });

      limparEstado(chatId);
      await enviarMenuPrincipal(chatId, usuario.apelido, !!usuario.dataNascimento);
      break;
    }

    // ---------- Data de nascimento: confirmação (trava depois de salva) ----------
    case 'nascimento_editar': {
      definirEstado(chatId, Estado.AGUARDANDO_DATA_NASCIMENTO);
      await bot.sendMessage(chatId, 'Digite sua data de nascimento no formato DD/MM/AAAA:');
      break;
    }

    case 'nascimento_confirmar': {
      const contexto = obterEstado(chatId);
      const dataNascimento = contexto?.dados?.dataNascimento as Date | undefined;
      if (!dataNascimento) {
        await bot.sendMessage(chatId, 'Algo deu errado, tenta de novo pelo menu.');
        limparEstado(chatId);
        break;
      }

      const usuario = await prisma.usuario.update({
        where: { telegramId: from.id },
        data: { dataNascimento },
      });

      limparEstado(chatId);
      // Explica que é só estatístico e que não muda mais — o botão já some
      // sozinho do menu, porque tecladoMenu(true) não inclui mais essa opção.
      await bot.sendMessage(
        chatId,
        'Data de nascimento salva. Obrigado! ✅\n\n' +
          'ℹ️ Isso é usado só para fins estatísticos e acadêmicos, e não pode ser alterado depois de confirmado.'
      );
      await enviarMenuPrincipal(chatId, usuario.apelido, true);
      break;
    }

    // ---------- Menu: mais informações (aviso legal completo) ----------
    case 'menu_mais_info': {
      await bot.sendMessage(chatId, AVISO_ACADEMICO, tecladoVoltarMenu());
      break;
    }

    case 'menu_voltar': {
      const usuario = await prisma.usuario.findUnique({ where: { telegramId: from.id } });
      if (usuario) await enviarMenuPrincipal(chatId, usuario.apelido, !!usuario.dataNascimento);
      break;
    }

    // ---------- Lembretes: criação ----------
    case 'menu_add_lembrete': {
      await bot.sendMessage(chatId, 'Esse lembrete vai ter data/hora pra te avisar, ou é só uma nota de texto?', tecladoConLembreteData);
      break;
    }

    case 'lembrete_com_data':
      definirEstado(chatId, Estado.AGUARDANDO_TEXTO_LEMBRETE, { comData: true });
      await bot.sendMessage(chatId, `Digite o texto do lembrete (máx. ${LIMITES.LEMBRETE_MAX_CARACTERES} caracteres):`);
      break;

    case 'lembrete_sem_data':
      definirEstado(chatId, Estado.AGUARDANDO_TEXTO_LEMBRETE, { comData: false });
      await bot.sendMessage(chatId, `Digite o texto do lembrete (máx. ${LIMITES.LEMBRETE_MAX_CARACTERES} caracteres):`);
      break;

    // ---------- Lembretes: listar (agora com contador X/20) ----------
    case 'menu_listar_lembretes': {
      const usuario = await prisma.usuario.findUnique({
        where: { telegramId: from.id },
        include: { lembretes: { orderBy: { criadoEm: 'desc' } } },
      });

      if (!usuario) break;

      if (usuario.lembretes.length === 0) {
        await bot.sendMessage(chatId, 'Você ainda não tem lembretes cadastrados.', tecladoMenu(!!usuario.dataNascimento));
        break;
      }

      const lista = usuario.lembretes
        .map((l, i) => {
          const quando = l.dataHora ? ` (⏰ ${formatarDataHora(l.dataHora)})` : '';
          return `${i + 1}. ${l.texto}${quando}`;
        })
        .join('\n');

      await bot.sendMessage(
        chatId,
        `Seus lembretes (${usuario.lembretes.length}/${LIMITES.MAX_LEMBRETES_POR_USUARIO}):\n\n${lista}`,
        tecladoMenu(!!usuario.dataNascimento)
      );
      break;
    }

    // ---------- Lembretes: apagar um específico ----------
    case 'menu_apagar_lembrete': {
      const usuario = await prisma.usuario.findUnique({
        where: { telegramId: from.id },
        include: { lembretes: { orderBy: { criadoEm: 'desc' } } },
      });

      if (!usuario) break;

      if (usuario.lembretes.length === 0) {
        await bot.sendMessage(chatId, 'Você não tem lembretes pra apagar.', tecladoMenu(!!usuario.dataNascimento));
        break;
      }

      // Botões montados na hora, um por lembrete (não dá pra deixar pronto em teclados.ts,
      // porque a quantidade de lembretes varia por usuário)
      const botoes = usuario.lembretes.map((l) => [
        { text: l.texto.slice(0, 40), callback_data: `apagar_lembrete_${l.id}` },
      ]);

      await bot.sendMessage(chatId, 'Qual lembrete deseja apagar?', {
        reply_markup: { inline_keyboard: botoes },
      });
      break;
    }

    // ---------- Data de nascimento: início do cadastro ----------
    case 'menu_add_nascimento': {
      definirEstado(chatId, Estado.AGUARDANDO_DATA_NASCIMENTO);
      await bot.sendMessage(chatId, 'Digite sua data de nascimento no formato DD/MM/AAAA:');
      break;
    }

    // ---------- Apagar todos os dados (LGPD-like) ----------
    case 'menu_apagar_tudo': {
      await bot.sendMessage(
        chatId,
        '⚠️ Isso vai apagar permanentemente seu cadastro e todos os seus lembretes. Tem certeza?',
        tecladoConfirmarApagarTudo()
      );
      break;
    }

    case 'apagar_tudo_cancelar': {
      const usuario = await prisma.usuario.findUnique({ where: { telegramId: from.id } });
      if (usuario) await enviarMenuPrincipal(chatId, usuario.apelido, !!usuario.dataNascimento);
      break;
    }

    case 'apagar_tudo_confirmar': {
      await prisma.usuario.delete({ where: { telegramId: from.id } }).catch(() => null);
      limparEstado(chatId);
      await bot.sendMessage(chatId, 'Pronto, todos os seus dados foram apagados. Se quiser começar de novo, manda /start.');
      break;
    }

    // ---------- Callback dinâmico: apagar_lembrete_<id> (um por lembrete, não dá pra ter case fixo) ----------
    default: {
      if (data?.startsWith('apagar_lembrete_')) {
        const id = Number(data.replace('apagar_lembrete_', ''));
        const usuario = await prisma.usuario.findUnique({ where: { telegramId: from.id } });
        if (usuario) {
          // o filtro usuarioId garante que ninguém apaga lembrete de outra pessoa
          await prisma.lembrete.deleteMany({ where: { id, usuarioId: usuario.id } });
          await bot.sendMessage(chatId, 'Lembrete apagado.', tecladoMenu(!!usuario.dataNascimento));
        }
      }
      break;
    }
  }
});

// ============================================================
// Mensagens de texto — só processadas se o chat estiver no meio
// de algum fluxo (tem um "estado" salvo)
// ============================================================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text;
  const from = msg.from;

  if (!texto || texto.startsWith('/') || !from) return;

  if (excedeuRateLimit(chatId)) {
    await bot.sendMessage(chatId, 'Calma aí! Você está mandando mensagens rápido demais, espera uns segundos. 🙏');
    return;
  }

  const contexto = obterEstado(chatId);
  if (!contexto) return; // sem fluxo ativo, ignora texto solto

  switch (contexto.estado) {
    // ---------- Onboarding: recebendo o apelido digitado ----------
    case Estado.AGUARDANDO_APELIDO: {
      if (!textoValido(texto, LIMITES.APELIDO_MAX_CARACTERES)) {
        await bot.sendMessage(chatId, `Manda um nome válido (até ${LIMITES.APELIDO_MAX_CARACTERES} caracteres).`);
        return;
      }
      definirEstado(chatId, Estado.AGUARDANDO_CONFIRMACAO_APELIDO, { apelido: texto.trim() });
      await bot.sendMessage(chatId, `Devo te chamar de "${texto.trim()}"?`, tecladoConfirmarApelido());
      break;
    }

    // ---------- Lembrete: recebendo o texto (antes de saber se tem data) ----------
    case Estado.AGUARDANDO_TEXTO_LEMBRETE: {
      if (!textoValido(texto, LIMITES.LEMBRETE_MAX_CARACTERES)) {
        await bot.sendMessage(chatId, `Texto inválido. Máximo de ${LIMITES.LEMBRETE_MAX_CARACTERES} caracteres.`);
        return;
      }

      const usuario = await prisma.usuario.findUnique({
        where: { telegramId: from.id },
        include: { _count: { select: { lembretes: true } } },
      });

      if (!usuario) {
        await bot.sendMessage(chatId, 'Não encontrei seu cadastro. Manda /start de novo.');
        limparEstado(chatId);
        return;
      }

      if (usuario._count.lembretes >= LIMITES.MAX_LEMBRETES_POR_USUARIO) {
        await bot.sendMessage(
          chatId,
          `Você atingiu o limite de ${LIMITES.MAX_LEMBRETES_POR_USUARIO} lembretes (${usuario._count.lembretes}/${LIMITES.MAX_LEMBRETES_POR_USUARIO}). Apague algum antes de criar um novo.`,
          tecladoMenu(!!usuario.dataNascimento)
        );
        limparEstado(chatId);
        return;
      }

      const comData = contexto.dados?.comData as boolean;

      if (comData) {
        // Ainda falta perguntar a data — guarda o texto no estado e avança
        definirEstado(chatId, Estado.AGUARDANDO_DATA_LEMBRETE, { texto: texto.trim() });
        await bot.sendMessage(chatId, 'Quando devo te lembrar? Formato: DD/MM/AAAA HH:mm');
      } else {
        // Sem data: já salva direto
        await prisma.lembrete.create({
          data: { texto: texto.trim(), usuarioId: usuario.id },
        });
        limparEstado(chatId);
        await bot.sendMessage(
          chatId,
          `Lembrete salvo! ✅ (${usuario._count.lembretes + 1}/${LIMITES.MAX_LEMBRETES_POR_USUARIO})`,
          tecladoMenu(!!usuario.dataNascimento)
        );
      }
      break;
    }

    // ---------- Lembrete: recebendo a data/hora ----------
    case Estado.AGUARDANDO_DATA_LEMBRETE: {
      const data = parseDataHora(texto);
      if (!data || !dataEhFutura(data)) {
        await bot.sendMessage(chatId, 'Data inválida ou no passado. Manda no formato DD/MM/AAAA HH:mm, com uma data futura.');
        return;
      }

      const usuario = await prisma.usuario.findUnique({
        where: { telegramId: from.id },
        include: { _count: { select: { lembretes: true } } },
      });
      if (!usuario) return;

      const textoLembrete = contexto.dados?.texto as string;
      await prisma.lembrete.create({
        data: { texto: textoLembrete, dataHora: data, usuarioId: usuario.id },
      });

      limparEstado(chatId);
      await bot.sendMessage(
        chatId,
        `Lembrete salvo! Vou te avisar em ${formatarDataHora(data)}. ✅ (${usuario._count.lembretes + 1}/${LIMITES.MAX_LEMBRETES_POR_USUARIO})\n\n` +
          '🔔 Não esqueça de ativar a notificação: clica no meu nome aqui em cima e depois no sino.',
        tecladoMenu(!!usuario.dataNascimento)
      );
      break;
    }

    // ---------- Data de nascimento: recebendo a data digitada (ainda não salva, só confirma) ----------
    case Estado.AGUARDANDO_DATA_NASCIMENTO: {
      const data = parseDataHora(texto);
      if (!data || dataEhFutura(data)) {
        await bot.sendMessage(chatId, 'Data inválida. Manda no formato DD/MM/AAAA.');
        return;
      }

      const idade = calcularIdade(data);
      definirEstado(chatId, Estado.AGUARDANDO_CONFIRMACAO_NASCIMENTO, { dataNascimento: data });
      await bot.sendMessage(
        chatId,
        `Confirmar data de nascimento: ${formatarDataHora(data)}. Idade: ${idade} anos\n\n` +
          'ℹ️ Isso é usado só para fins estatísticos/acadêmicos e não poderá ser alterado depois.',
        tecladoConfirmarNascimento()
      );
      break;
    }
  }
});

iniciarAgendadorDeLembretes(bot);

//fim