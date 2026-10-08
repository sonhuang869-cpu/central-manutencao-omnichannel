import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft, Clock, Lock, Send, Sparkles } from "lucide-react";
import { Boton, Campo, Dialogo, Esqueleto, Etiqueta, Sello, Selector, Vacio } from "@/components/base";
import { useApp } from "@/estado";
import * as api from "@/lib/api";
import { RegraError } from "@/lib/api";
import { JanelaError, janelaDe, podeEnviar, restante } from "@/lib/janela";
import {
  brl, CANAIS, dataHora, DEPARTAMENTOS, desde, hora,
  type Canal, type Conversa, type DepartamentoId,
} from "@/lib/tipos";
import { cx } from "@/lib/cx";

const TOM_CANAL: Record<Canal, "marca" | "neutro" | "bem" | "prazo"> = {
  whatsapp: "bem", instagram: "marca", messenger: "marca", email: "neutro", site: "neutro",
};

/** O relógio da janela precisa andar sozinho: o prazo vence com a tela aberta. */
function useRelogio(ms = 30000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return agora;
}

export default function Caixa() {
  const { dados, carregando, aplicar } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<DepartamentoId | "todos">("todos");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [transferindo, setTransferindo] = useState(false);
  const agora = useRelogio();
  const fim = useRef<HTMLDivElement>(null);

  const conversas = dados?.conversas ?? [];
  // A seleção inicial sai do render, não de um efeito: guardar em estado o que
  // já dá para calcular provoca um render a mais e depende da lista, que muda
  // de identidade toda vez.
  const escolhida = sel ?? conversas[0]?.id ?? null;
  const atual = dados && escolhida ? api.conversaDe(dados, escolhida) : null;
  const mensagens = dados && atual ? api.mensagensDe(dados, atual.id) : [];

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length, escolhida]);

  if (carregando || !dados) {
    return <div className="grid gap-3 lg:grid-cols-[22rem_minmax(0,1fr)]"><Esqueleto className="h-[70vh]" /><Esqueleto className="h-[70vh]" /></div>;
  }

  const lista = conversas
    .filter((c) => filtro === "todos" || c.departamento === filtro)
    .sort((a, b) => b.ultimaEntrada.localeCompare(a.ultimaEntrada));

  const nome = (contatoId: string) => dados.contatos.find((c) => c.id === contatoId)?.nome ?? "—";
  const condo = (id: string) => dados.condominios.find((c) => c.id === id)?.nome ?? "—";
  const quem = (id: string | null | undefined) =>
    id ? dados.atendentes.find((a) => a.id === id)?.nome ?? "—" : "sem responsável";

  const permissao = atual ? podeEnviar(atual, agora) : null;
  const janela = atual ? janelaDe(atual, agora) : null;

  const correr = async (accao: () => Promise<unknown>, sucesso: string) => {
    setEnviando(true);
    try {
      await accao();
      aplicar(await api.obterDados());
      toast.success(sucesso);
      return true;
    } catch (e) {
      toast.error(
        e instanceof JanelaError || e instanceof RegraError ? e.message : "Não foi possível.",
        { duration: 8000 },
      );
      return false;
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start">
      {/* lista */}
      <section className="rounded-md border border-linea bg-tarjeta">
        <div className="border-b border-linea p-2.5">
          <Selector value={filtro} onChange={(e) => setFiltro(e.target.value as DepartamentoId | "todos")}
            aria-label="Filtrar por departamento" data-testid="filtro-departamento">
            <option value="todos">Todos os departamentos ({conversas.length})</option>
            {(Object.keys(DEPARTAMENTOS) as DepartamentoId[]).map((k) => (
              <option key={k} value={k}>
                {DEPARTAMENTOS[k].nome} ({conversas.filter((c) => c.departamento === k).length})
              </option>
            ))}
          </Selector>
        </div>
        {lista.length === 0 ? (
          <div className="p-4"><Vacio titulo="Nenhuma conversa nesse departamento" /></div>
        ) : (
          <ul className="max-h-[66vh] divide-y divide-linea overflow-y-auto" data-testid="conversas">
            {lista.map((c) => {
              const j = janelaDe(c, agora);
              return (
                <li key={c.id}>
                  <button onClick={() => setSel(c.id)} data-testid={`conversa-${c.id}`}
                    data-janela={j.aplica ? (j.aberta ? "aberta" : "fechada") : "nao-aplica"}
                    className={cx("w-full px-3 py-2.5 text-left transition-colors",
                      escolhida === c.id ? "bg-marca-claro" : "hover:bg-papel")}>
                    <span className="flex items-center gap-1.5">
                      <Sello tono={TOM_CANAL[c.canal]}>{CANAIS[c.canal].curto}</Sello>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{nome(c.contatoId)}</span>
                      <span className="shrink-0 text-[11px] text-tinta-tenue">{desde(c.ultimaEntrada, agora)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-tinta-media">{c.assunto}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="truncate text-[11px] text-tinta-tenue">{DEPARTAMENTOS[c.departamento].nome}</span>
                      {j.aplica && !j.aberta && (
                        <Sello tono="prazo" className="ml-auto">janela fechada</Sello>
                      )}
                      {j.aplica && j.apertada && (
                        <Sello tono="prazo" className="ml-auto">{restante(j.restaMs)}</Sello>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* conversa */}
      {!atual ? (
        <Vacio titulo="Escolha uma conversa" />
      ) : (
        <section className="flex min-h-[66vh] flex-col rounded-md border border-linea bg-tarjeta">
          <header className="flex flex-wrap items-start justify-between gap-2 border-b border-linea px-4 py-3">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 font-semibold">
                {nome(atual.contatoId)}
                <Sello tono={TOM_CANAL[atual.canal]}>{CANAIS[atual.canal].nome}</Sello>
              </h1>
              <p className="truncate text-xs text-tinta-media">
                {condo(atual.condominioId)} · {DEPARTAMENTOS[atual.departamento].nome} · {quem(atual.atendenteId)}
              </p>
            </div>
            <Boton variante="contorno" className="px-3" onClick={() => setTransferindo(true)} data-testid="abrir-transferir">
              <ArrowRightLeft className="size-4" aria-hidden /> Transferir
            </Boton>
          </header>

          {atual.transferencias.length > 0 && (
            <ul className="border-b border-linea bg-papel px-4 py-2" data-testid="historico-transferencias">
              {atual.transferencias.map((t, i) => (
                <li key={i} className="text-[11px] text-tinta-media">
                  {dataHora(t.em)} · de {DEPARTAMENTOS[t.de].nome} para {DEPARTAMENTOS[t.para].nome} ·{" "}
                  {quem(t.por)} · {t.motivo}
                </li>
              ))}
            </ul>
          )}

          <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4" data-testid="mensagens">
            {mensagens.map((m) => (
              <div key={m.id} className={cx("flex flex-col", m.direcao === "saida" ? "items-end" : "items-start")}
                data-direcao={m.direcao} data-tipo={m.tipoSaida ?? ""}>
                <div className={cx("max-w-[80%] rounded-md px-3 py-2 text-sm leading-relaxed",
                  m.direcao === "saida" ? "bg-marca text-white" : "border border-linea bg-papel")}>
                  {m.tipoSaida === "modelo" && (
                    <span className="mb-1 flex items-center gap-1 text-[11px] opacity-85">
                      <Sparkles className="size-3" aria-hidden /> modelo aprovado · {brl(m.custo ?? 0)}
                    </span>
                  )}
                  {m.texto}
                </div>
                <span className="mt-0.5 text-[10px] text-tinta-tenue">
                  {hora(m.em)}{m.atendenteId ? ` · ${quem(m.atendenteId)}` : ""}
                </span>
              </div>
            ))}
            <div ref={fim} />
          </div>

          {/* o composer muda de natureza com a janela */}
          <div className="border-t border-linea px-4 py-3">
            {janela?.aplica && (
              <p className={cx("mb-2 flex items-start gap-1.5 rounded-sm px-3 py-2 text-xs",
                janela.aberta
                  ? janela.apertada ? "bg-prazo-claro text-prazo" : "bg-bem-claro text-bem"
                  : "bg-prazo-claro text-prazo")}
                data-testid="aviso-janela">
                {janela.aberta ? <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  : <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                {permissao?.motivo}
              </p>
            )}

            {permissao?.livre ? (
              <form className="flex gap-2" onSubmit={async (e) => {
                e.preventDefault();
                if (await correr(() => api.responderLivre(atual.id, texto), "Mensagem enviada.")) setTexto("");
              }}>
                <Campo value={texto} onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva a resposta" aria-label="Resposta" data-testid="campo-resposta" />
                <Boton type="submit" disabled={!texto.trim() || enviando} data-testid="enviar" className="px-3">
                  <Send className="size-4" aria-hidden />
                </Boton>
              </form>
            ) : (
              <div data-testid="so-modelos">
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-tinta-media uppercase">
                  Modelos aprovados
                </p>
                <ul className="space-y-1.5">
                  {dados.modelos.filter((m) => m.aprovado).map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => correr(() => api.enviarModelo(atual.id, m.id), "Modelo enviado.")}
                        disabled={enviando} data-testid={`modelo-${m.id}`}
                        className="w-full rounded-sm border border-linea px-3 py-2 text-left hover:border-marca disabled:opacity-50">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{m.nome}</span>
                          <span className="mono shrink-0 text-xs text-prazo">{brl(m.custo)}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-tinta-media">{m.texto}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Boton variante="fantasma" className="mt-2 w-full text-xs" disabled={enviando}
                  data-testid="simular-resposta"
                  onClick={() => correr(
                    () => api.simularEntrada(atual.id, "Oi, desculpa a demora. Pode seguir."),
                    "O cliente respondeu: a janela reabriu.",
                  )}>
                  Simular resposta do cliente
                </Boton>
              </div>
            )}
          </div>
        </section>
      )}

      <DialogoTransferir aberto={transferindo} aoFechar={() => setTransferindo(false)}
        conversa={atual} aoConfirmar={async (para, motivo) => {
          if (await correr(() => api.transferir(atual!.id, para, motivo), "Conversa transferida.")) setTransferindo(false);
        }} ocupado={enviando} />
    </div>
  );
}

function DialogoTransferir({ aberto, aoFechar, conversa, aoConfirmar, ocupado }: {
  aberto: boolean; aoFechar: () => void; conversa: Conversa | null;
  aoConfirmar: (para: DepartamentoId, motivo: string) => void; ocupado: boolean;
}) {
  const [para, setPara] = useState<DepartamentoId>("chamados");
  const [motivo, setMotivo] = useState("");
  if (!conversa) return null;

  return (
    <Dialogo abierto={aberto} alCerrar={aoFechar} titulo="Transferir conversa"
      descripcion="O histórico vai junto e fica registrado quem transferiu, para onde e por quê."
      testid="dialogo-transferir">
      <div className="space-y-3">
        <div>
          <Etiqueta htmlFor="para">Departamento de destino</Etiqueta>
          <Selector id="para" value={para} onChange={(e) => setPara(e.target.value as DepartamentoId)}
            data-testid="destino">
            {(Object.keys(DEPARTAMENTOS) as DepartamentoId[])
              .filter((k) => k !== conversa.departamento)
              .map((k) => <option key={k} value={k}>{DEPARTAMENTOS[k].nome}</option>)}
          </Selector>
        </div>
        <div>
          <Etiqueta htmlFor="motivo">Motivo</Etiqueta>
          <Campo id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por que está saindo deste departamento" data-testid="motivo" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Boton variante="fantasma" onClick={aoFechar}>Voltar</Boton>
          <Boton disabled={!motivo.trim() || ocupado} data-testid="confirmar-transferir"
            onClick={() => aoConfirmar(para, motivo)}>Transferir</Boton>
        </div>
      </div>
    </Dialogo>
  );
}
