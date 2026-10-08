/** Todo valor em centavos inteiros. Proposta de manutenção fecha no centavo. */
export type Centavos = number;

export type Canal = "whatsapp" | "instagram" | "messenger" | "email" | "site";

export const CANAIS: Record<Canal, { nome: string; curto: string }> = {
  whatsapp: { nome: "WhatsApp", curto: "WA" },
  instagram: { nome: "Instagram Direct", curto: "IG" },
  messenger: { nome: "Messenger", curto: "MS" },
  email: { nome: "E-mail", curto: "@" },
  site: { nome: "Chat do site", curto: "WEB" },
};

export type DepartamentoId =
  | "plantao" | "chamados" | "comercial" | "financeiro" | "visita";

export const DEPARTAMENTOS: Record<DepartamentoId, { nome: string; descricao: string }> = {
  plantao: { nome: "Plantão 24h", descricao: "Emergência fora do horário" },
  chamados: { nome: "Abertura de chamados", descricao: "Ocorrência em equipamento" },
  comercial: { nome: "Comercial e orçamentos", descricao: "Proposta e renovação" },
  financeiro: { nome: "Financeiro e administrativo", descricao: "Boleto, nota, contrato" },
  visita: { nome: "Primeira visita gratuita", descricao: "Agendamento de vistoria" },
};

export type Papel = "admin" | "supervisor" | "atendente";

export interface Atendente {
  id: string;
  nome: string;
  papel: Papel;
  departamentos: DepartamentoId[];
  ativo: boolean;
}

export interface Administradora {
  id: string;
  nome: string;
  cnpj: string;
}

export interface Condominio {
  id: string;
  nome: string;
  administradoraId: string;
  cidade: string;
  unidades: number;
  equipamentos: string[];
  contratoMensal: Centavos;
  desde: string;
}

export interface Contato {
  id: string;
  nome: string;
  cargo: string;
  condominioId: string;
  telefone: string;
  email: string;
}

export type Direcao = "entrada" | "saida";

/**
 * Mensagem de saída pelo WhatsApp é uma de duas coisas, nunca as duas:
 * texto livre dentro da janela, ou modelo aprovado fora dela.
 */
export type TipoSaida = "livre" | "modelo";

export interface Mensagem {
  id: string;
  conversaId: string;
  direcao: Direcao;
  texto: string;
  em: string;
  atendenteId?: string;
  tipoSaida?: TipoSaida;
  modeloId?: string;
  custo?: Centavos;
}

export type StatusConversa = "aberta" | "pendente" | "resolvida";

export interface Conversa {
  id: string;
  canal: Canal;
  contatoId: string;
  condominioId: string;
  departamento: DepartamentoId;
  atendenteId: string | null;
  status: StatusConversa;
  assunto: string;
  criadaEm: string;
  /** Última mensagem recebida do cliente. É daqui que a janela conta. */
  ultimaEntrada: string;
  transferencias: { de: DepartamentoId; para: DepartamentoId; em: string; por: string; motivo: string }[];
}

export type CategoriaModelo = "utilidade" | "marketing" | "servico";

export interface Modelo {
  id: string;
  nome: string;
  categoria: CategoriaModelo;
  texto: string;
  /** Custo por conversa iniciada com este modelo, em centavos. */
  custo: Centavos;
  aprovado: boolean;
}

export type EtapaFunil = "novo" | "visita" | "proposta" | "negociacao" | "fechado" | "perdido";

export const ETAPAS: Record<EtapaFunil, string> = {
  novo: "Lead novo",
  visita: "Visita agendada",
  proposta: "Proposta enviada",
  negociacao: "Em negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export interface Negocio {
  id: string;
  condominioNome: string;
  administradora: string;
  etapa: EtapaFunil;
  valorMensal: Centavos;
  origem: string;
  utmSource: string;
  utmCampaign: string;
  responsavelId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Automacao {
  id: string;
  nome: string;
  descricao: string;
  quemInicia: "cliente" | "plataforma";
  canal: Canal;
  modeloId?: string;
  porMes: number;
  ativa: boolean;
}

export interface Dados {
  atendentes: Atendente[];
  administradoras: Administradora[];
  condominios: Condominio[];
  contatos: Contato[];
  conversas: Conversa[];
  mensagens: Mensagem[];
  modelos: Modelo[];
  negocios: Negocio[];
  automacoes: Automacao[];
  sessaoId: string;
}

export const brl = (c: Centavos): string =>
  ((c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const data = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function desde(iso: string, agora = Date.now()): string {
  const m = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 60000));
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}
