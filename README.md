# Central — CRM e atendimento omnichannel para manutenção predial

Demonstração feita para uma vaga de desenvolvimento de plataforma de CRM com
atendimento omnichannel, para uma empresa de manutenção preventiva em
condomínios.

Os condomínios, as administradoras, os síndicos, as conversas e os valores são
inventados. Nenhuma API da Meta, do Google ou do Omie é chamada. O que é real é
a regra.

## As três coisas que isto existe para mostrar

**A janela de 24 horas do WhatsApp.** Passadas 24 horas da última mensagem do
cliente, a empresa não pode mandar texto livre: só modelo aprovado pela Meta, e
aí cada envio custa. Na tela, a conversa fora da janela não tem campo de texto —
ele não aparece desabilitado, ele não existe — e no lugar dele ficam os modelos
com o preço ao lado. Uma integração que deixa o campo sempre ativo manda a
mensagem, recebe erro da API e some com ela sem ninguém perceber.

**Quase toda automação pedida é a empresa iniciando a conversa.** Lembrete de
visita, acompanhamento de orçamento, aviso de chamado encerrado e boleto
disponível começam a conversa, então são modelos aprovados com custo por envio.
Chatbot de triagem e distribuição automática respondem quem escreveu primeiro, e
não custam nada. A tela de automações separa as duas pilhas e soma o mês.

**Transferir entre departamentos é mover o histórico, não reabrir o caso.** A
conversa muda de departamento, o atendente passa a ser alguém daquele
departamento, e fica registrado quem transferiu, de onde, para onde e por quê.
As mensagens vão junto, sem perder nem duplicar.

## Decisões que sustentam o resto

Todo valor é inteiro, em centavos. A janela conta da última mensagem **de
entrada**, não da criação da conversa, e só se aplica ao WhatsApp — Instagram,
Messenger, e-mail e chat do site não têm janela nenhuma. O relógio é estado na
interface, então uma conversa que está a dez minutos de fechar fecha sozinha com
a aba aberta.

## Telas

| Rota | O que faz |
|---|---|
| `/` | Caixa única, filtro por departamento, janela por conversa, envio livre ou por modelo, transferência com histórico |
| `/automacoes` | As automações separadas por quem inicia, com o custo do mês por categoria de modelo |
| `/funil` | Seis etapas, valor em aberto e fechado, e a campanha de origem preservada até o contrato |
| `/clientes` | Condomínios com administradora, contato, equipamentos e contrato mensal |

## Stack

Vite, React 19, TypeScript, Tailwind v4, React Router v6, Zustand, Lucide,
Sonner. Estado em `localStorage` atrás de uma API assíncrona em `src/lib/api.ts`.
Em produção o caminho é Chatwoot para a caixa e os departamentos, n8n para os
fluxos, e esta camada como a experiência única por cima.

    npm install
    npm run dev

## Verificação

257 asserções sobre o núcleo, rodadas no Node contra `src/lib/*`, varrendo a
janela hora a hora de 0 a 48 para confirmar que ela fecha exatamente em 24 e
nunca reabre sozinha.

Depois de a bateria passar, sete versões deliberadamente mal feitas foram
rodadas ao lado: janela contada da criação em vez da última entrada, janela
aplicada a todos os canais, texto livre sempre permitido, modelo sem aprovação
aceito, custo contando também o que o cliente inicia, transferência sem registro
e transferência mantendo o atendente antigo.

Cinco quebraram na hora. **Duas não**, e essas valeram mais que o resto:

1. O guard de "quem inicia a conversa" no cálculo de custo nunca era exercitado,
   porque nenhuma automação iniciada pelo cliente tinha modelo configurado. A
   asserção passava sem testar nada. Passou a testar a função direto, com uma
   automação de cliente **com** modelo, exigindo custo zero.
2. A asserção de troca de atendente na transferência escolhia um caso em que o
   atendente antigo também pertencia ao departamento de destino, então manter o
   antigo passava. Passou a transferir para um departamento onde ele não está.

Justin Gnoh · outubro de 2026
