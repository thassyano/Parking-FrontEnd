/**
 * Calcula a permanência entre entrada e saída (apenas dias, horas e minutos) e a descreve em texto.
 * Ex.: 2 dias, 23 horas e 24 minutos.
 *
 * É apenas exibição: a regra de cobrança continua sendo a do back-end.
 */
export function formatDuration(entrada: Date, saida: Date): string {
  const diffMs = saida.getTime() - entrada.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return '';

  const totalMinutos = Math.floor(diffMs / 60_000);
  const dias = Math.floor(totalMinutos / (24 * 60));
  const horas = Math.floor((totalMinutos % (24 * 60)) / 60);
  const minutos = totalMinutos % 60;

  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);
  if (horas > 0) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`);
  if (minutos > 0) partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`);

  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0];

  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/**
 * Quantidade de diárias cheias: cada 24h completas conta 1 e o restante conta mais 1 a partir de 12h.
 * Ex.: 1 dia e 12h = 2 diárias; 2 dias e 13h = 3 diárias; 5h = 0 (o parcial menor que 12h é cobrado por faixa).
 *
 * É apenas exibição: a regra de cobrança continua sendo a do back-end.
 */
export function calcularDiariasCobradas(entrada: Date, saida: Date): number {
  const horas = (saida.getTime() - entrada.getTime()) / 3_600_000;
  if (Number.isNaN(horas) || horas <= 0) return 0;

  const completas = Math.floor(horas / 24);
  const resto = horas - completas * 24;
  return completas + (resto >= 12 ? 1 : 0);
}
