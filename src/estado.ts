// Máquina de estados simples em memória.
// Guarda em que "passo" cada chat está no meio de um fluxo (onboarding, cadastro de lembrete, etc).

export enum Estado {
  AGUARDANDO_APELIDO = 'AGUARDANDO_APELIDO',
  AGUARDANDO_CONFIRMACAO_APELIDO = 'AGUARDANDO_CONFIRMACAO_APELIDO',
  AGUARDANDO_TEXTO_LEMBRETE = 'AGUARDANDO_TEXTO_LEMBRETE',
  AGUARDANDO_DATA_LEMBRETE = 'AGUARDANDO_DATA_LEMBRETE',
  AGUARDANDO_DATA_NASCIMENTO = 'AGUARDANDO_DATA_NASCIMENTO',
}

interface ContextoEstado {
  estado: Estado;
  dados?: Record<string, unknown>;
}

const estados = new Map<number, ContextoEstado>();

export function definirEstado(chatId: number, estado: Estado, dados?: Record<string, unknown>) {
  const atual = estados.get(chatId);
  estados.set(chatId, { estado, dados: { ...atual?.dados, ...dados } });
}

export function obterEstado(chatId: number): ContextoEstado | undefined {
  return estados.get(chatId);
}

export function limparEstado(chatId: number) {
  estados.delete(chatId);
}