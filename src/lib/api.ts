import { custoDoModelo, janelaDe, podeEnviar, JanelaError } from "./janela";
import { semear } from "./semente";
import type { Conversa, Dados, DepartamentoId, Mensagem, Negocio, EtapaFunil } from "./tipos";

const CHAVE = "central:dados:v1";

const espera = (min = 180, max = 480) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

function ler(): Dados {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto) as Dados;
  } catch {
    /* armazenamento bloqueado: semeia de novo */
  }
  const novo = semear();
  gravar(novo);
  return novo;
}

function gravar(d: Dados): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(d));
  } catch {
    /* sem espaço ou aba anônima */
  }
}

let seq = 0;
const novoId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export class RegraError extends Error {
  constructor(m: string) {
    super(m);
    this.name = "RegraError";
  }
}

export async function obterDados(): Promise<Dados> {
  await espera(120, 300);
  return ler();
}

export const conversaDe = (d: Dados, id: string): Conversa | null =>
  d.conversas.find((c) => c.id === id) ?? null;

export const mensagensDe = (d: Dados, conversaId: string): Mensagem[] =>
  d.mensagens.filter((m) => m.conversaId === conversaId).sort((a, b) => a.em.localeCompare(b.em));

/**
 * Enviar texto livre. Só passa se a janela permitir.
 *
 * A checagem vive aqui e não só na tela: uma integração que confia na interface
 * manda a mensagem, recebe erro da API e some com ela sem ninguém perceber.
 */
export async function responderLivre(conversaId: string, texto: string): Promise<Dados> {
  await espera(250, 550);
  const d = ler();
  const c = conversaDe(d, conversaId);
  if (!c) throw new RegraError("Conversa não encontrada.");
  if (!texto.trim()) throw new RegraError("A mensagem está vazia.");

  const p = podeEnviar(c);
  if (!p.livre)
    throw new JanelaError(
      "A janela de 24 horas fechou. Fora dela o WhatsApp só aceita modelo aprovado, e a mensagem livre não chegaria ao cliente.",
    );

  d.mensagens.push({
    id: novoId("m"), conversaId, direcao: "saida", texto: texto.trim(),
    em: new Date().toISOString(), atendenteId: d.sessaoId, tipoSaida: "livre",
  });
  gravar(d);
  return d;
}

export async function enviarModelo(conversaId: string, modeloId: string): Promise<Dados> {
  await espera(400, 800);
  const d = ler();
  const c = conversaDe(d, conversaId);
  if (!c) throw new RegraError("Conversa não encontrada.");

  const modelo = d.modelos.find((m) => m.id === modeloId);
  if (!modelo) throw new RegraError("Modelo não encontrado.");
  const custo = custoDoModelo(d.modelos, modeloId);

  d.mensagens.push({
    id: novoId("m"), conversaId, direcao: "saida",
    texto: modelo.texto, em: new Date().toISOString(),
    atendenteId: d.sessaoId, tipoSaida: "modelo", modeloId, custo,
  });
  gravar(d);
  return d;
}

/** O cliente responde. É o único evento que reabre a janela. */
export async function simularEntrada(conversaId: string, texto: string): Promise<Dados> {
  await espera(200, 400);
  const d = ler();
  const c = conversaDe(d, conversaId);
  if (!c) throw new RegraError("Conversa não encontrada.");
  const agora = new Date().toISOString();
  d.mensagens.push({
    id: novoId("m"), conversaId, direcao: "entrada", texto, em: agora,
  });
  c.ultimaEntrada = agora;
  c.status = "aberta";
  gravar(d);
  return d;
}

export async function transferir(
  conversaId: string, para: DepartamentoId, motivo: string,
): Promise<Dados> {
  await espera(250, 500);
  const d = ler();
  const c = conversaDe(d, conversaId);
  if (!c) throw new RegraError("Conversa não encontrada.");
  if (c.departamento === para) throw new RegraError("A conversa já está nesse departamento.");
  if (!motivo.trim()) throw new RegraError("Escreva o motivo da transferência.");

  c.transferencias.push({
    de: c.departamento, para, em: new Date().toISOString(), por: d.sessaoId, motivo: motivo.trim(),
  });
  c.departamento = para;
  // O atendente antigo sai; quem for do departamento novo assume.
  const candidato = d.atendentes.find((a) => a.ativo && a.departamentos.includes(para));
  c.atendenteId = candidato?.id ?? null;
  gravar(d);
  return d;
}

export async function mudarStatus(conversaId: string, status: Conversa["status"]): Promise<Dados> {
  await espera(150, 350);
  const d = ler();
  const c = conversaDe(d, conversaId);
  if (!c) throw new RegraError("Conversa não encontrada.");
  c.status = status;
  gravar(d);
  return d;
}

export async function moverNegocio(negocioId: string, etapa: EtapaFunil): Promise<Dados> {
  await espera(180, 380);
  const d = ler();
  const n = d.negocios.find((x) => x.id === negocioId);
  if (!n) throw new RegraError("Negócio não encontrado.");
  n.etapa = etapa;
  n.atualizadoEm = new Date().toISOString();
  gravar(d);
  return d;
}

export async function alternarAutomacao(id: string, ativa: boolean): Promise<Dados> {
  await espera(150, 300);
  const d = ler();
  const a = d.automacoes.find((x) => x.id === id);
  if (!a) throw new RegraError("Automação não encontrada.");
  if (ativa && a.modeloId) {
    const m = d.modelos.find((x) => x.id === a.modeloId);
    if (m && !m.aprovado)
      throw new RegraError(
        `O modelo "${m.nome}" ainda não foi aprovado pela Meta. Enquanto não for, esta automação não tem como disparar.`,
      );
  }
  a.ativa = ativa;
  gravar(d);
  return d;
}

export const janelaDaConversa = janelaDe;

export const negociosPorEtapa = (d: Dados, etapa: EtapaFunil): Negocio[] =>
  d.negocios.filter((n) => n.etapa === etapa);

export async function restaurar(): Promise<Dados> {
  const novo = semear();
  gravar(novo);
  await espera(220, 420);
  return novo;
}
