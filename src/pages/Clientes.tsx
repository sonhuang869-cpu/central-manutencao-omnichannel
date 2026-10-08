import { useState } from "react";
import { Search } from "lucide-react";
import { Campo, Esqueleto, Sello, Vacio } from "@/components/base";
import { useApp } from "@/estado";
import { CANAIS, brl, data } from "@/lib/tipos";

export default function Clientes() {
  const { dados, carregando } = useApp();
  const [q, setQ] = useState("");
  if (carregando || !dados) return <div className="space-y-3"><Esqueleto className="h-10" /><Esqueleto className="h-80" /></div>;

  const t = q.trim().toLowerCase();
  const lista = dados.condominios.filter((c) => {
    if (!t) return true;
    const adm = dados.administradoras.find((a) => a.id === c.administradoraId)?.nome ?? "";
    const ct = dados.contatos.find((x) => x.condominioId === c.id)?.nome ?? "";
    return `${c.nome} ${adm} ${ct} ${c.cidade}`.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Condomínios</h1>
        <p className="text-sm text-tinta-media">
          Cada condomínio com sua administradora, o contato que fala com a gente e o histórico.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-tinta-tenue" aria-hidden />
        <Campo value={q} onChange={(e) => setQ(e.target.value)} className="pl-8"
          placeholder="Condomínio, administradora, síndico ou cidade"
          aria-label="Buscar condomínios" data-testid="buscar" />
      </div>

      {lista.length === 0 ? (
        <Vacio titulo={`Nada encontrado para "${q.trim()}"`} />
      ) : (
        <ul className="space-y-2" data-testid="condominios">
          {lista.map((c) => {
            const adm = dados.administradoras.find((a) => a.id === c.administradoraId);
            const contato = dados.contatos.find((x) => x.condominioId === c.id);
            const conversas = dados.conversas.filter((x) => x.condominioId === c.id);
            return (
              <li key={c.id} className="rounded-md border border-linea bg-tarjeta p-3" data-condominio={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.nome}</p>
                    <p className="text-xs text-tinta-media">
                      {adm?.nome} · <span className="clave">{adm?.cnpj}</span> · {c.cidade} · {c.unidades} unidades
                    </p>
                    {contato && (
                      <p className="mt-0.5 text-xs text-tinta-media">
                        {contato.nome}, {contato.cargo} · <span className="clave">{contato.telefone}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="mono text-sm font-semibold">{brl(c.contratoMensal)}</p>
                    <p className="text-[11px] text-tinta-tenue">cliente desde {data(c.desde)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {c.equipamentos.map((e) => <Sello key={e}>{e}</Sello>)}
                  {conversas.length > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-tinta-media">
                      {conversas.length} atendimento{conversas.length === 1 ? "" : "s"} ·{" "}
                      {[...new Set(conversas.map((x) => CANAIS[x.canal].curto))].join(", ")}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
