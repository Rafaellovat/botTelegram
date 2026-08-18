// Regras de validação e proteção contra abuso.

export const LIMITES = {
  APELIDO_MAX_CARACTERES: 30,
  LEMBRETE_MAX_CARACTERES: 500,
  MAX_LEMBRETES_POR_USUARIO: 20,
  RATE_LIMIT_MENSAGENS: 5, // máximo de mensagens...
  RATE_LIMIT_JANELA_MS: 10_000, // ...a cada 10 segundos
};

export function textoValido(texto: string | undefined, maxCaracteres: number): texto is string {
  if (!texto) return false;
  const limpo = texto.trim();
  if (limpo.length === 0) return false;
  if (limpo.length > maxCaracteres) return false;
  return true;
}

const historicoMensagens = new Map<number, number[]>();

export function excedeuRateLimit(chatId: number): boolean {
  const agora = Date.now();
  const historico = historicoMensagens.get(chatId) ?? [];

  const recentes = historico.filter((t) => agora - t < LIMITES.RATE_LIMIT_JANELA_MS);
  recentes.push(agora);
  historicoMensagens.set(chatId, recentes);

  return recentes.length > LIMITES.RATE_LIMIT_MENSAGENS;
}