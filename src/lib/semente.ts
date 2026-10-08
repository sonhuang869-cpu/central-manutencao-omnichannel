import type {
  Administradora, Atendente, Automacao, Condominio, Contato, Conversa, Dados,
  Mensagem, Modelo, Negocio,
} from "./tipos";

function prng(s: number) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d: Date) => d.toISOString();
const atras = (agora: Date, horas: number) => new Date(agora.getTime() - horas * 3600000);

export function semear(agora = new Date()): Dados {
  const r = prng(20261008);

  const atendentes: Atendente[] = [
    { id: "a-01", nome: "Laerte Marchetti", papel: "admin", departamentos: ["plantao", "chamados", "comercial", "financeiro", "visita"], ativo: true },
    { id: "a-02", nome: "Rejane Siqueira", papel: "supervisor", departamentos: ["chamados", "plantao"], ativo: true },
    { id: "a-03", nome: "Wagner Toledo", papel: "atendente", departamentos: ["plantao", "chamados"], ativo: true },
    { id: "a-04", nome: "Simone Vasques", papel: "atendente", departamentos: ["comercial", "visita"], ativo: true },
    { id: "a-05", nome: "Edinaldo Brito", papel: "atendente", departamentos: ["financeiro"], ativo: true },
    { id: "a-06", nome: "Tatiane Crespo", papel: "atendente", departamentos: ["comercial"], ativo: false },
  ];

  const administradoras: Administradora[] = [
    { id: "ad-1", nome: "Administradora Vila Prado", cnpj: "18.472.336/0001-55" },
    { id: "ad-2", nome: "Grupo Habita Gestão Predial", cnpj: "27.905.114/0001-08" },
    { id: "ad-3", nome: "Síndico Profissional Nogueira", cnpj: "33.661.820/0001-71" },
  ];

  const EQUIP = ["moto bomba", "VRP", "piscina", "pressurização", "reservatório", "gerador"];

  const condominios: Condominio[] = [
    ["Residencial Alvorada", "ad-1", "São Paulo", 96, 219000],
    ["Edifício Costa Verde", "ad-1", "Santo André", 48, 148000],
    ["Condomínio Jardim das Palmeiras", "ad-2", "São Bernardo", 164, 312000],
    ["Residencial Monte Líbano", "ad-2", "São Paulo", 72, 186000],
    ["Edifício Porto Seguro", "ad-3", "Guarulhos", 40, 132000],
    ["Condomínio Parque das Águas", "ad-2", "Osasco", 210, 398000],
    ["Residencial Bela Vista", "ad-1", "Diadema", 60, 164000],
    ["Edifício Solar do Lago", "ad-3", "São Caetano", 54, 142000],
  ].map(([nome, adm, cidade, unidades, contrato], i) => ({
    id: `c-${String(i + 1).padStart(2, "0")}`,
    nome: nome as string,
    administradoraId: adm as string,
    cidade: cidade as string,
    unidades: unidades as number,
    equipamentos: EQUIP.slice(0, 2 + Math.floor(r() * 3)),
    contratoMensal: contrato as number,
    criadoEm: "",
    desde: iso(new Date(agora.getTime() - (400 + i * 90) * 86400000)),
  })) as Condominio[];

  const NOMES = [
    ["Marcos Aurélio Pinto", "síndico"], ["Cleide Barroso", "zeladora"],
    ["Antônio Vilela", "síndico"], ["Fabiana Quirino", "gerente predial"],
    ["Reinaldo Esteves", "subsíndico"], ["Lúcia Mendonça", "síndica"],
    ["Gilmar Peçanha", "zelador"], ["Neusa Cardim", "conselheira"],
  ];
  const contatos: Contato[] = NOMES.map(([nome, cargo], i) => ({
    id: `ct-${i + 1}`,
    nome, cargo,
    condominioId: condominios[i].id,
    telefone: `+55 11 9${String(70000000 + Math.floor(r() * 9999999)).slice(0, 8)}`,
    email: `${nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")[0]}@${condominios[i].nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "").slice(0, 12)}.com.br`,
  }));

  const modelos: Modelo[] = [
    { id: "m-visita", nome: "Lembrete de visita técnica", categoria: "utilidade", custo: 8, aprovado: true,
      texto: "Olá {{1}}, aqui é da General Engenharia. Sua manutenção preventiva está agendada para {{2}} às {{3}}. Confirma?" },
    { id: "m-orcamento", nome: "Acompanhamento de orçamento", categoria: "utilidade", custo: 8, aprovado: true,
      texto: "Olá {{1}}, enviamos a proposta do {{2}} no dia {{3}}. Posso ajudar com alguma dúvida?" },
    { id: "m-chamado", nome: "Chamado encerrado", categoria: "utilidade", custo: 8, aprovado: true,
      texto: "Olá {{1}}, o chamado {{2}} foi encerrado. O relatório da visita está no e-mail do condomínio." },
    { id: "m-boleto", nome: "Boleto disponível", categoria: "utilidade", custo: 8, aprovado: true,
      texto: "Olá {{1}}, o boleto de {{2}} do {{3}} já está disponível. Vencimento em {{4}}." },
    { id: "m-campanha", nome: "Primeira visita gratuita", categoria: "marketing", custo: 23, aprovado: false,
      texto: "Olá {{1}}, a General Engenharia está oferecendo uma visita de vistoria gratuita para condomínios em {{2}}." },
  ];

  /* As conversas. Uma de cada caso que importa: janela aberta e folgada, janela
     apertada, janela fechada, conversa que já foi transferida, e canais que não
     têm janela nenhuma. */
  const conversas: Conversa[] = [
    { id: "cv-1", canal: "whatsapp", contatoId: "ct-1", condominioId: "c-01", departamento: "plantao",
      atendenteId: "a-03", status: "aberta", assunto: "Moto bomba 2 desarmando desde a madrugada",
      criadaEm: iso(atras(agora, 3)), ultimaEntrada: iso(atras(agora, 0.4)), transferencias: [] },
    { id: "cv-2", canal: "whatsapp", contatoId: "ct-3", condominioId: "c-03", departamento: "chamados",
      atendenteId: "a-02", status: "aberta", assunto: "Vazamento na VRP do bloco B",
      criadaEm: iso(atras(agora, 26)), ultimaEntrada: iso(atras(agora, 22.5)), transferencias: [
        { de: "plantao", para: "chamados", em: iso(atras(agora, 24)), por: "a-03", motivo: "Fora da emergência, virou chamado comum" },
      ] },
    { id: "cv-3", canal: "whatsapp", contatoId: "ct-4", condominioId: "c-04", departamento: "comercial",
      atendenteId: "a-04", status: "pendente", assunto: "Renovação do contrato anual",
      criadaEm: iso(atras(agora, 73)), ultimaEntrada: iso(atras(agora, 31)), transferencias: [] },
    { id: "cv-4", canal: "whatsapp", contatoId: "ct-6", condominioId: "c-06", departamento: "financeiro",
      atendenteId: "a-05", status: "aberta", assunto: "Segunda via do boleto de setembro",
      criadaEm: iso(atras(agora, 50)), ultimaEntrada: iso(atras(agora, 47)), transferencias: [] },
    { id: "cv-5", canal: "instagram", contatoId: "ct-2", condominioId: "c-02", departamento: "visita",
      atendenteId: null, status: "aberta", assunto: "Quer saber da visita gratuita",
      criadaEm: iso(atras(agora, 5)), ultimaEntrada: iso(atras(agora, 4.6)), transferencias: [] },
    { id: "cv-6", canal: "site", contatoId: "ct-5", condominioId: "c-05", departamento: "comercial",
      atendenteId: "a-04", status: "aberta", assunto: "Pedido de orçamento pelo formulário",
      criadaEm: iso(atras(agora, 9)), ultimaEntrada: iso(atras(agora, 8.2)), transferencias: [] },
    { id: "cv-7", canal: "email", contatoId: "ct-7", condominioId: "c-07", departamento: "financeiro",
      atendenteId: "a-05", status: "resolvida", assunto: "Nota fiscal de agosto",
      criadaEm: iso(atras(agora, 120)), ultimaEntrada: iso(atras(agora, 96)), transferencias: [] },
    { id: "cv-8", canal: "messenger", contatoId: "ct-8", condominioId: "c-08", departamento: "chamados",
      atendenteId: "a-03", status: "aberta", assunto: "Barulho na casa de máquinas",
      criadaEm: iso(atras(agora, 14)), ultimaEntrada: iso(atras(agora, 13)), transferencias: [] },
  ];

  const falas: Record<string, [string, string][]> = {
    "cv-1": [
      ["entrada", "Boa noite, a moto bomba 2 está desarmando toda hora desde umas 3 da manhã. O prédio está sem pressão nos andares altos."],
      ["saida", "Boa noite, seu Marcos. Já estou abrindo o plantão. O quadro está indicando alguma luz de falha?"],
      ["entrada", "Está piscando uma luz vermelha no lado direito."],
      ["saida", "É relé térmico. Vou mandar o Wagner agora, chega em uns 40 minutos. Pode deixar a chave geral desligada até ele chegar."],
      ["entrada", "Desliguei. Obrigado pela rapidez."],
    ],
    "cv-2": [
      ["entrada", "Bom dia, tem água saindo embaixo da VRP do bloco B desde ontem."],
      ["saida", "Bom dia. Como não é parada total, vou transferir para abertura de chamados e eles agendam ainda hoje."],
      ["entrada", "Está bom, só não pode demorar muito."],
    ],
    "cv-3": [
      ["entrada", "Oi Simone, o conselho pediu para rever o valor da renovação."],
      ["saida", "Claro. Posso levar uma proposta revisada na reunião de quinta?"],
      ["entrada", "Pode sim, manda antes por e-mail para eu repassar."],
    ],
    "cv-4": [
      ["entrada", "Preciso da segunda via do boleto de setembro, o síndico não encontrou."],
      ["saida", "Já reenvio pelo e-mail do condomínio."],
    ],
    "cv-5": [
      ["entrada", "Vi no Instagram que vocês fazem uma vistoria gratuita. Como funciona?"],
    ],
    "cv-6": [
      ["entrada", "Gostaria de um orçamento para manutenção preventiva mensal de 40 unidades."],
      ["saida", "Perfeito. Consigo te mandar hoje. O condomínio tem piscina e gerador?"],
    ],
    "cv-7": [
      ["entrada", "Bom dia, podem reenviar a nota fiscal de agosto?"],
      ["saida", "Bom dia, segue em anexo. Qualquer coisa estamos à disposição."],
    ],
    "cv-8": [
      ["entrada", "Tem um barulho forte na casa de máquinas desde o fim de semana."],
      ["saida", "Vou abrir o chamado e agendar a visita. O barulho é contínuo ou só quando a bomba liga?"],
      ["entrada", "Só quando liga."],
    ],
  };

  const mensagens: Mensagem[] = [];
  let n = 0;
  for (const cv of conversas) {
    const lista = falas[cv.id] ?? [];
    const inicio = new Date(cv.criadaEm).getTime();
    const fim = new Date(cv.ultimaEntrada).getTime();
    const passo = lista.length > 1 ? (fim - inicio) / (lista.length - 1) : 0;
    lista.forEach(([dir, texto], i) => {
      mensagens.push({
        id: `m-${String(++n).padStart(4, "0")}`,
        conversaId: cv.id,
        direcao: dir as "entrada" | "saida",
        texto,
        em: iso(new Date(inicio + passo * i)),
        atendenteId: dir === "saida" ? cv.atendenteId ?? "a-01" : undefined,
        tipoSaida: dir === "saida" ? "livre" : undefined,
      });
    });
  }

  const negocios: Negocio[] = [
    ["Residencial Nova Aurora", "Administradora Vila Prado", "novo", 172000, "Meta Ads", "facebook", "visita-gratuita-out"],
    ["Edifício Terra Nova", "Grupo Habita Gestão Predial", "visita", 198000, "Google Ads", "google", "manutencao-predial-sp"],
    ["Condomínio Vila Rica", "Síndico Profissional Nogueira", "proposta", 245000, "Indicação", "direto", ""],
    ["Residencial Araucária", "Grupo Habita Gestão Predial", "proposta", 163000, "Meta Ads", "facebook", "visita-gratuita-out"],
    ["Edifício Mirante", "Administradora Vila Prado", "negociacao", 289000, "Google Ads", "google", "moto-bomba-manutencao"],
    ["Condomínio Alto da Serra", "Síndico Profissional Nogueira", "negociacao", 134000, "Site", "direto", ""],
    ["Residencial Monte Líbano", "Grupo Habita Gestão Predial", "fechado", 186000, "Meta Ads", "facebook", "visita-gratuita-set"],
    ["Edifício Porto Seguro", "Síndico Profissional Nogueira", "fechado", 132000, "Indicação", "direto", ""],
    ["Condomínio Recanto Verde", "Administradora Vila Prado", "perdido", 151000, "Google Ads", "google", "manutencao-predial-sp"],
  ].map(([nome, adm, etapa, valor, origem, src, camp], i) => ({
    id: `n-${i + 1}`,
    condominioNome: nome as string,
    administradora: adm as string,
    etapa: etapa as Negocio["etapa"],
    valorMensal: valor as number,
    origem: origem as string,
    utmSource: src as string,
    utmCampaign: camp as string,
    responsavelId: i % 2 === 0 ? "a-04" : "a-01",
    criadoEm: iso(new Date(agora.getTime() - (60 - i * 5) * 86400000)),
    atualizadoEm: iso(new Date(agora.getTime() - (20 - i * 2) * 86400000)),
  }));

  const automacoes: Automacao[] = [
    { id: "au-1", nome: "Chatbot de triagem", descricao: "Pergunta se é emergência e encaminha ao departamento certo.", quemInicia: "cliente", canal: "whatsapp", porMes: 320, ativa: true },
    { id: "au-2", nome: "Distribuição automática", descricao: "Entrega a conversa ao atendente livre do departamento.", quemInicia: "cliente", canal: "whatsapp", porMes: 320, ativa: true },
    { id: "au-3", nome: "Lembrete de visita técnica", descricao: "Véspera da manutenção preventiva mensal.", quemInicia: "plataforma", canal: "whatsapp", modeloId: "m-visita", porMes: 148, ativa: true },
    { id: "au-4", nome: "Acompanhamento de orçamento", descricao: "Três dias depois da proposta enviada.", quemInicia: "plataforma", canal: "whatsapp", modeloId: "m-orcamento", porMes: 34, ativa: true },
    { id: "au-5", nome: "Chamado encerrado", descricao: "Avisa o síndico quando a ordem de serviço fecha.", quemInicia: "plataforma", canal: "whatsapp", modeloId: "m-chamado", porMes: 96, ativa: true },
    { id: "au-6", nome: "Boleto disponível", descricao: "Todo dia 25, para os contratos ativos.", quemInicia: "plataforma", canal: "whatsapp", modeloId: "m-boleto", porMes: 8, ativa: true },
    { id: "au-7", nome: "Campanha de visita gratuita", descricao: "Disparo para a base de administradoras.", quemInicia: "plataforma", canal: "whatsapp", modeloId: "m-campanha", porMes: 400, ativa: false },
    { id: "au-8", nome: "Resposta fora do horário", descricao: "Avisa o prazo do plantão quando chega mensagem de madrugada.", quemInicia: "cliente", canal: "whatsapp", porMes: 64, ativa: true },
  ];

  return {
    atendentes, administradoras, condominios, contatos, conversas, mensagens,
    modelos, negocios, automacoes, sessaoId: "a-01",
  };
}
