import { toast } from "sonner";
import { Boton, Chave, Esqueleto, Sello } from "@/components/base";
import { useApp } from "@/estado";
import * as api from "@/lib/api";
import { RegraError } from "@/lib/api";
import { custoMensal } from "@/lib/janela";
import { CANAIS, brl } from "@/lib/tipos";
import { cx } from "@/lib/cx";

export default function Automacoes() {
  const { dados, carregando, aplicar } = useApp();
  if (carregando || !dados) return <div className="space-y-3"><Esqueleto className="h-28" /><Esqueleto className="h-80" /></div>;

  const custo = custoMensal(dados.automacoes, dados.modelos);
  const ativas = dados.automacoes.filter((a) => a.ativa);
  const iniciadasPelaEmpresa = ativas.filter((a) => a.quemInicia === "plataforma");

  const alternar = async (id: string, v: boolean) => {
    try {
      aplicar(await api.alternarAutomacao(id, v));
    } catch (e) {
      toast.error(e instanceof RegraError ? e.message : "Não foi possível alterar.", { duration: 7000 });
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Automações e o que elas custam</h1>
        <p className="text-sm text-tinta-media">
          Responder o cliente dentro da janela não custa nada. Começar a conversa, sim.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="indicadores">
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">custo do mês</p>
          <p className="mono text-2xl font-semibold text-prazo" data-testid="custo-mes">{brl(custo.total)}</p>
          <p className="text-xs text-tinta-tenue">só conversas que a empresa inicia</p>
        </div>
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">disparos sem custo</p>
          <p className="mono text-2xl font-semibold" data-testid="gratuitos">{custo.gratuitas.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-tinta-tenue">resposta dentro da janela</p>
        </div>
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">automações ativas</p>
          <p className="mono text-2xl font-semibold">{ativas.length}</p>
          <p className="text-xs text-tinta-tenue">de {dados.automacoes.length}</p>
        </div>
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">iniciadas pela empresa</p>
          <p className="mono text-2xl font-semibold">{iniciadasPelaEmpresa.length}</p>
          <p className="text-xs text-tinta-tenue">todas exigem modelo</p>
        </div>
      </section>

      {custo.porCategoria.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-linea">
          <table className="w-full text-sm">
            <caption className="sr-only">Custo por categoria de modelo</caption>
            <thead className="bg-papel text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Categoria</th>
                <th className="px-3 py-2 text-right font-semibold">Envios/mês</th>
                <th className="px-3 py-2 text-right font-semibold">Custo</th>
              </tr>
            </thead>
            <tbody data-testid="por-categoria">
              {custo.porCategoria.map((c) => (
                <tr key={c.categoria} className="border-t border-linea" data-categoria={c.categoria}>
                  <td className="px-3 py-2">{c.categoria}</td>
                  <td className="mono px-3 py-2 text-right">{c.envios.toLocaleString("pt-BR")}</td>
                  <td className="mono px-3 py-2 text-right font-semibold">{brl(c.custo)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-tinta bg-papel">
                <td className="px-3 py-2 font-bold" colSpan={2}>Total</td>
                <td className="mono px-3 py-2 text-right font-bold text-prazo">{brl(custo.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <ul className="space-y-2" data-testid="automacoes">
        {dados.automacoes.map((a) => {
          const modelo = dados.modelos.find((m) => m.id === a.modeloId);
          const custoDela = modelo && a.quemInicia === "plataforma" ? a.porMes * modelo.custo : 0;
          return (
            <li key={a.id} className={cx("rounded-md border bg-tarjeta p-3",
              a.ativa ? "border-linea" : "border-dashed border-linea opacity-70")}
              data-automacao={a.id} data-ativa={a.ativa}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.nome}</p>
                  <p className="text-sm text-tinta-media">{a.descricao}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Sello>{CANAIS[a.canal].nome}</Sello>
                    <Sello tono={a.quemInicia === "plataforma" ? "prazo" : "bem"}>
                      {a.quemInicia === "plataforma" ? "a empresa inicia" : "o cliente inicia"}
                    </Sello>
                    {modelo && (
                      <Sello tono={modelo.aprovado ? "neutro" : "alto"}>
                        modelo {modelo.aprovado ? "aprovado" : "sem aprovação"}
                      </Sello>
                    )}
                    <span className="mono text-[11px] text-tinta-tenue">
                      {a.porMes.toLocaleString("pt-BR")}/mês
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cx("mono text-sm font-semibold", custoDela > 0 ? "text-prazo" : "text-tinta-tenue")}>
                    {custoDela > 0 ? brl(custoDela) : "sem custo"}
                  </p>
                </div>
                <Chave id={`au-${a.id}`} ligado={a.ativa} onMudar={(v) => alternar(a.id, v)}
                  rotulo={`Ativar ${a.nome}`} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-md border border-marca/25 bg-marca-claro p-4 text-sm leading-relaxed">
        <p className="font-semibold text-marca">Por que isto importa no orçamento</p>
        <p className="mt-1 text-tinta">
          Quase tudo que você listou em automações é a empresa começando a conversa: lembrete de
          visita, acompanhamento de orçamento, aviso de chamado encerrado, boleto disponível. Cada
          um desses é um modelo que a Meta precisa aprovar antes e que passa a ter custo por envio.
          O chatbot de triagem e a distribuição automática, que respondem quem já escreveu, não
          custam nada. É a diferença entre uma conta de dezenas de reais por mês e uma de centenas.
        </p>
        <p className="mt-2 text-xs text-tinta-media">
          Os valores por modelo são de referência e mudam por categoria e por país; entram no
          contrato depois de conferidos na tabela vigente da Meta.
        </p>
      </div>

      <Boton variante="fantasma" className="text-xs" onClick={() => window.scrollTo({ top: 0 })}>
        Voltar ao topo
      </Boton>
    </div>
  );
}
