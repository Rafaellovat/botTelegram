// Parser simples de data no formato brasileiro, sem dependência externa.
// Aceita "DD/MM/AAAA HH:mm" (lembrete com hora) ou "DD/MM/AAAA" (data de nascimento).

export function parseDataHora(texto: string): Date | null {
  const match = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!match) return null;

  const [, dia, mes, ano, hora, minuto] = match;
  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    hora ? Number(hora) : 0,
    minuto ? Number(minuto) : 0,
    0,
    0
  );

  if (
    data.getDate() !== Number(dia) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getFullYear() !== Number(ano)
  ) {
    return null;
  }

  return data;
}

export function dataEhFutura(data: Date): boolean {
  return data.getTime() > Date.now();
}

export function formatarDataHora(data: Date): string {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}