# Central — CRM e atendimento omnichannel para manutenção predial

Demonstração feita para uma vaga de desenvolvimento de plataforma de CRM com
atendimento omnichannel, parecida com a Kommo, para uma empresa de manutenção
preventiva em condomínios.

Os condomínios, administradoras, síndicos, conversas e valores são inventados.
Nenhuma API da Meta, do Google ou do Omie é chamada: nada sai daqui. O que é
real é a regra.

## A regra que decide o projeto

**O WhatsApp oficial tem uma janela de 24 horas.** Ela conta da última mensagem
do cliente, não da criação da conversa. Dentro dela o atendente escreve o que
quiser e não custa nada. Fora dela só sai modelo aprovado pela Meta, e a
conversa passa a ter custo.

Na caixa de entrada isso não é um aviso: é a interface mudando de natureza. Com
a janela aberta existe um campo de texto. Com a janela fechada o campo não
existe — no lugar dele aparece a lista de modelos aprovados, cada um com o custo
ao lado. Quem responde ao cliente dentro da janela não paga; quem começa a
conversa paga.

É isso que derruba integração caseira: o campo fica sempre habilitado, o
atendente escreve, aperta enviar, a API recusa e a mensagem some sem ninguém
perceber.

**Só o WhatsApp tem janela.** Instagram, Messenger, e-mail e chat do site não
funcionam assim, e na tela isso se vê: nessas conversas o aviso nem aparece.

## As outras três

**Quase toda automação pedida é a empresa começando a conversa.** Lembrete de
visita, acompanhamento de orçamento, chamado encerrado e boleto disponível caem
fora da janela: exigem modelo aprovado e têm custo por envio. Chatbot de
triagem, distribuição automática e resposta fora do horário respondem a quem já
escreveu, e por isso não custam nada. A tela de automações separa os dois e soma
o mês.

**Modelo não aprovado não dispara.** A campanha de visita gratuita está
desligada porque o modelo dela ainda está em revisão, e o sistema recusa ligá-la.
Aprovação leva dias, então os modelos são submetidos no primeiro dia do projeto,
antes de qualquer tela ficar pronta.

**Transferir não é trocar de etiqueta.** Quando a conversa muda de
departamento, o histórico vai junto, fica registrado quem transferiu e por quê,
e quem assume é alguém do departamento de destino — não o atendente anterior,
que já considerou o assunto encerrado.

## Decisão que sustenta o resto

Todo valor é inteiro, em centavos. Todo prazo é derivado do relógio e não de um
campo de estado: "janela fechada" não é algo que alguém marca, é uma comparação
com a hora, recalculada enquanto a tela está aberta.

## Telas

| Rota | O que faz |
|---|---|
| `/` | Caixa única com os cinco departamentos, janela por conversa, transferência com histórico |
| `/automacoes` | Os oito fluxos, separados entre os que custam e os que não, com o total do mês |
| `/funil` | Funil comercial com origem por UTM e valor mensal de contrato |
| `/clientes` | Condomínios com administradora, equipamentos e contrato |

## Stack

Vite, React 19, TypeScript, Tailwind v4, React Router v6, Zustand, Lucide,
Sonner. Estado em `localStorage` atrás de uma API assíncrona em `src/lib/api.ts`.

Na entrega real o caminho é outro e está na proposta: Chatwoot para a caixa e os
conectores, n8n para as automações. Esta demonstração existe para mostrar as
regras funcionando num link, não para ser o produto final.

    npm install
    npm run dev

## Verificação

257 asserções sobre o núcleo, rodadas no Node contra `src/lib/*`, e 32 asserções
de navegador contra a build, a 1400px e a 390px. Sem erros de console.

Depois de a bateria passar, foram rodadas sete versões deliberadamente erradas
para conferir se as asserções realmente quebravam: janela contada da criação em
vez da última entrada, janela aplicada a todos os canais, texto livre sempre
permitido, modelo não aprovado aceito, custo contando também o que o cliente
inicia, transferência sem registrar histórico e transferência mantendo o
atendente antigo.

Cinco quebraram na primeira tentativa. Duas não, e as duas eram defeito da
asserção:

1. O guarda que isenta de custo quem responde dentro da janela nunca era
   exercitado, porque nenhuma automação iniciada pelo cliente tinha modelo
   configurado. A asserção passou a testar a função direto com esse caso.
2. A transferência escolhida para o teste ia de plantão para chamados, e o
   atendente de plantão também era de chamados — então manter o atendente antigo
   passava no teste. Passou a transferir para comercial, onde ele não está.

Justin Gnoh · outubro de 2026
