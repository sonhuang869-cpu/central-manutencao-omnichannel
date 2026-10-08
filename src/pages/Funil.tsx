import { toast } from "sonner";
import { Esqueleto, Sello, Selector } from "@/components/base";
import { useApp } from "@/estado";
import * as api from "@/lib/api";
import { ETAPAS, brl, data, type EtapaFunil } from "@/lib/tipos";
import { cx } from "@/lib/cx";

const ORDEM: EtapaFunil[] = ["novo", "visita", "proposta", "negociacao", "fechado", "perdido"];

export default function Funil() {
  const { dados, carregando, aplicar } = useApp();
  if (carregando || !dados) return <div className="space-y-3"><Esqueleto className="h-24" /><Esqueleto className="h-80" /></div>;

  const emAberto = dados.negocios.filter((n) => !["fechado", "perdido"].includes(n.etapa));
  const valorAberto = emAberto.reduce((s, n) => s + n.valorMensal, 0);
  const fechados = dados.negocios.filter((n) => n.etapa === "fechado");
  const valorFechado = fechados.reduce((s, n) => s + n.valorMensal, 0);

  // A origem vem do UTM, que é como se liga a campanha paga ao contrato assinado.
  const porOrigem = [...new Map(dados.negocios.map((n) => [n.origem, n.origem])).keys()]
    .map((origem) => {
      const todos = dados.negocios.filter((n) => n.origem === origem);
      const ganhos = todos.filter((n) => n.etapa === "fechado");
      return {
        origem,
        total: todos.length,
        ganhos: ganhos.length,
        valor: ganhos.reduce((s, n) => s + n.valorMensal, 0),
        campanha: todos.find((n) => n.utmCampaign)?.utmCampaign ?? "—",
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const mover = async (id: string, etapa: EtapaFunil) => {
    try {
      aplicar(await api.moverNegocio(id, etapa));
      toast.success(`Movido para ${ETAPAS[etapa].toLowerCase()}.`);
    } catch {
      toast.error("Não foi possível mover.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Funil comercial</h1>
        <p className="text-sm text-tinta-media">
          Da captação ao contrato, com a origem de cada lead preservada até o fechamento.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">em aberto</p>
          <p className="mono text-2xl font-semibold" data-testid="valor-aberto">{brl(valorAberto)}</p>
          <p className="text-xs text-tinta-tenue">{emAberto.length} negócios, mensal</p>
        </div>
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">fechado</p>
          <p className="mono text-2xl font-semibold text-bem">{brl(valorFechado)}</p>
          <p className="text-xs text-tinta-tenue">{fechados.length} contratos</p>
        </div>
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">contratos ativos</p>
          <p className="mono text-2xl font-semibold">{dados.condominios.length}</p>
          <p className="text-xs text-tinta-tenue">condomínios atendidos</p>
        </div>
        <div className="rounded-md border border-linea bg-tarjeta p-3">
          <p className="text-xs text-tinta-media">carteira mensal</p>
          <p className="mono text-2xl font-semibold">
            {brl(dados.condominios.reduce((s, c) => s + c.contratoMensal, 0))}
          </p>
          <p className="text-xs text-tinta-tenue">soma dos contratos</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="funil">
        {ORDEM.map((etapa) => {
          const lista = api.negociosPorEtapa(dados, etapa);
          const soma = lista.reduce((s, n) => s + n.valorMensal, 0);
          return (
            <div key={etapa} className="rounded-md border border-linea bg-tarjeta" data-etapa={etapa}>
              <div className="flex items-baseline justify-between gap-2 border-b border-linea px-3 py-2">
                <p className="text-sm font-semibold">{ETAPAS[etapa]}</p>
                <p className="mono text-xs text-tinta-media">{lista.length} · {brl(soma)}</p>
              </div>
              {lista.length === 0 ? (
                <p className="px-3 py-4 text-xs text-tinta-tenue">Nada aqui.</p>
              ) : (
                <ul className="divide-y divide-linea">
                  {lista.map((n) => (
                    <li key={n.id} className="px-3 py-2.5" data-negocio={n.id}>
                      <p className="text-sm font-medium">{n.condominioNome}</p>
                      <p className="text-xs text-tinta-media">{n.administradora}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Sello tono={n.utmSource === "direto" ? "neutro" : "archivo"}>{n.origem}</Sello>
                        {n.utmCampaign && (
                          <span className="clave text-[10.5px] text-tinta-tenue">utm_campaign={n.utmCampaign}</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="mono text-sm font-semibold">{brl(n.valorMensal)}</span>
                        <span className="text-[11px] text-tinta-tenue">{data(n.atualizadoEm)}</span>
                        <Selector value={n.etapa} aria-label={`Etapa de ${n.condominioNome}`}
                          data-testid={`etapa-${n.id}`} className="ml-auto h-8 w-32 text-xs"
                          onChange={(e) => mover(n.id, e.target.value as EtapaFunil)}>
                          {ORDEM.map((o) => <option key={o} value={o}>{ETAPAS[o]}</option>)}
                        </Selector>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold">De onde vieram os contratos</h2>
        <div className="overflow-x-auto rounded-md border border-linea">
          <table className="w-full text-sm">
            <caption className="sr-only">Negócios por origem</caption>
            <thead className="bg-papel text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Origem</th>
                <th className="px-3 py-2 font-semibold">Campanha</th>
                <th className="px-3 py-2 text-right font-semibold">Leads</th>
                <th className="px-3 py-2 text-right font-semibold">Fechados</th>
                <th className="px-3 py-2 text-right font-semibold">Mensal ganho</th>
              </tr>
            </thead>
            <tbody data-testid="por-origem">
              {porOrigem.map((o) => (
                <tr key={o.origem} className="border-t border-linea" data-origem={o.origem}>
                  <td className="px-3 py-2">{o.origem}</td>
                  <td className="clave px-3 py-2 text-tinta-media">{o.campanha}</td>
                  <td className="mono px-3 py-2 text-right">{o.total}</td>
                  <td className="mono px-3 py-2 text-right">{o.ganhos}</td>
                  <td className={cx("mono px-3 py-2 text-right font-semibold", o.valor > 0 && "text-bem")}>
                    {brl(o.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-xs text-tinta-media">
          O parâmetro de campanha fica gravado no lead e sobrevive até o contrato. Sem isso, a conta
          do anúncio mostra quantos formulários chegaram e nunca quantos viraram contrato.
        </p>
      </section>
    </div>
  );
}
