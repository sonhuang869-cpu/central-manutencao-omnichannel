import type { Canal, Conversa, Mensagem, Modelo } from "./tipos";

/**
 * A janela de 24 horas do WhatsApp.
 *
 * Dentro de 24 horas contadas da última mensagem do cliente, a empresa responde
 * texto livre. Fora disso, só modelo aprovado, e aí a mensagem custa. Não é uma
 * regra da plataforma que a gente escolha: é da API oficial, e é o que separa
 * uma integração que dura de uma que derruba o número.
 */
export const JANELA_MS = 24 * 60 * 60 * 1000;

/** Só o WhatsApp tem janela. Os outros canais não funcionam assim. */
export const temJanela = (canal: Canal): boolean => canal === "whatsapp";

export interface EstadoJanela {
  aplica: boolean;
  aberta: boolean;
  restaMs: number;
  /** Menos de duas horas: ainda dá para responder de graça, mas pouco. */
  apertada: boolean;
}

export function janelaDe(conversa: Conversa, agora = Date.now()): EstadoJanela {
  if (!temJanela(conversa.canal))
    return { aplica: false, aberta: true, restaMs: 0, apertada: false };
  const resta = new Date(conversa.ultimaEntrada).getTime() + JANELA_MS - agora;
  return {
    aplica: true,
    aberta: resta > 0,
    restaMs: Math.max(0, resta),
    apertada: resta > 0 && resta < 2 * 60 * 60 * 1000,
  };
}

export function restante(ms: number): string {
  if (ms <= 0) return "fechada";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

export class JanelaError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "JanelaError";
  }
}

/**
 * O que a plataforma deixa fazer agora nesta conversa.
 *
 * Deixar o campo de texto livre sempre habilitado e descobrir o erro na
 * resposta da API é como quase toda integração caseira falha: o atendente
 * escreve, aperta enviar, e a mensagem não chega sem ninguém perceber.
 */
export interface Permissao {
  livre: boolean;
  modelo: boolean;
  motivo: string;
}

export function podeEnviar(conversa: Conversa, agora = Date.now()): Permissao {
  const j = janelaDe(conversa, agora);
  if (!j.aplica) return { livre: true, modelo: false, motivo: "" };
  if (j.aberta)
    return {
      livre: true,
      modelo: false,
      motivo: `Janela aberta por mais ${restante(j.restaMs)}. Resposta livre, sem custo.`,
    };
  return {
    livre: false,
    modelo: true,
    motivo: "Passaram-se mais de 24 horas desde a última mensagem do cliente. Só modelo aprovado, e a conversa passa a ter custo.",
  };
}

export function custoDoModelo(modelos: Modelo[], modeloId: string): number {
  const m = modelos.find((x) => x.id === modeloId);
  if (!m) throw new JanelaError("Modelo não encontrado.");
  if (!m.aprovado) throw new JanelaError("Este modelo ainda não foi aprovado pela Meta.");
  return m.custo;
}

/** Quanto custaria um mês de automações, por categoria de modelo. */
export interface CustoMes {
  porCategoria: { categoria: string; envios: number; custo: number }[];
  total: number;
  gratuitas: number;
}

export function custoMensal(
  automacoes: { ativa: boolean; quemInicia: string; canal: Canal; modeloId?: string; porMes: number }[],
  modelos: Modelo[],
): CustoMes {
  const acc = new Map<string, { envios: number; custo: number }>();
  let gratuitas = 0;

  for (const a of automacoes) {
    if (!a.ativa) continue;
    // Quem responde a um cliente dentro da janela não paga nada: o custo só
    // existe quando é a plataforma que começa a conversa.
    if (a.quemInicia === "cliente" || a.canal !== "whatsapp" || !a.modeloId) {
      gratuitas += a.porMes;
      continue;
    }
    const m = modelos.find((x) => x.id === a.modeloId);
    if (!m) continue;
    const atual = acc.get(m.categoria) ?? { envios: 0, custo: 0 };
    acc.set(m.categoria, { envios: atual.envios + a.porMes, custo: atual.custo + a.porMes * m.custo });
  }

  const porCategoria = [...acc.entries()]
    .map(([categoria, v]) => ({ categoria, ...v }))
    .sort((a, b) => b.custo - a.custo);

  return { porCategoria, total: porCategoria.reduce((s, c) => s + c.custo, 0), gratuitas };
}

export const naoLidas = (mensagens: Mensagem[], conversaId: string): number =>
  mensagens.filter((m) => m.conversaId === conversaId && m.direcao === "entrada").length;
