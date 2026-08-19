export const tecladoConsentimento = {
  reply_markup: {
    inline_keyboard: [[
      { text: 'Continuar', callback_data: 'consentimento_continuar' },
      { text: 'Recusar', callback_data: 'consentimento_recusar' },
    ]],
  },
};

export function tecladoConfirmarApelido() {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Confirmar', callback_data: 'apelido_confirmar' },
        { text: 'Editar', callback_data: 'apelido_editar' },
      ]],
    },
  };
}

export function tecladoConfirmarNascimento() {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Confirmar', callback_data: 'nascimento_confirmar' },
        { text: 'Editar', callback_data: 'nascimento_editar' },
      ]],
    },
  };
}

// Menu principal montado dinamicamente.
// O botão de data de nascimento só aparece se o usuário ainda não cadastrou.
export function tecladoMenu(temDataNascimento: boolean) {
  const botoes: { text: string; callback_data: string }[][] = [
    [{ text: '➕ Adicionar lembrete', callback_data: 'menu_add_lembrete' }],
    [{ text: '📋 Listar lembretes', callback_data: 'menu_listar_lembretes' }],
    [{ text: '🗑️ Apagar lembrete', callback_data: 'menu_apagar_lembrete' }],
  ];

  if (!temDataNascimento) {
    botoes.push([{ text: '🎂 Adicionar data de nascimento', callback_data: 'menu_add_nascimento' }]);
  }

  botoes.push([{ text: 'ℹ️ Mais informações', callback_data: 'menu_mais_info' }]);
  botoes.push([{ text: '⚠️ Apagar todos os meus dados', callback_data: 'menu_apagar_tudo' }]);

  return { reply_markup: { inline_keyboard: botoes } };
}

export function tecladoVoltarMenu() {
  return {
    reply_markup: { inline_keyboard: [[{ text: '⬅️ Voltar ao menu', callback_data: 'menu_voltar' }]] },
  };
}

export const tecladoConLembreteData = {
  reply_markup: {
    inline_keyboard: [[
      { text: 'Com data/hora', callback_data: 'lembrete_com_data' },
      { text: 'Sem data (só texto)', callback_data: 'lembrete_sem_data' },
    ]],
  },
};

export function tecladoConfirmarApagarTudo() {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Sim, apagar tudo', callback_data: 'apagar_tudo_confirmar' },
        { text: 'Cancelar', callback_data: 'apagar_tudo_cancelar' },
      ]],
    },
  };
}