import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { Inbox, Menu, RotateCcw, Users, Workflow, X, Zap } from "lucide-react";
import { useApp } from "@/estado";
import { cx } from "@/lib/cx";

const LINKS = [
  { a: "/", texto: "Caixa de entrada", Icone: Inbox },
  { a: "/funil", texto: "Funil", Icone: Workflow },
  { a: "/automacoes", texto: "Automações", Icone: Zap },
  { a: "/clientes", texto: "Condomínios", Icone: Users },
];

export default function Armacao() {
  const { eu, restaurar } = useApp();
  const [menu, setMenu] = useState(false);
  const atendente = eu();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-linea bg-papel/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
            <span className="grid size-7 place-items-center rounded-xs bg-marca text-xs text-white">G</span>
            Central
          </Link>
          <nav className="ml-4 hidden gap-0.5 lg:flex" aria-label="Principal">
            {LINKS.map(({ a, texto }) => (
              <NavLink key={a} to={a} end={a === "/"}
                className={({ isActive }) =>
                  cx("rounded-sm px-2.5 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-marca-claro text-marca" : "text-tinta-media hover:text-tinta")}>
                {texto}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {atendente && (
              <div className="hidden text-right sm:block">
                <p className="text-xs leading-tight font-semibold">{atendente.nome}</p>
                <p className="text-[11px] text-tinta-media">General Engenharia</p>
              </div>
            )}
            <button onClick={async () => { await restaurar(); toast.success("Demonstração restaurada."); }}
              aria-label="Restaurar demonstração" title="Restaurar demonstração" data-testid="restaurar"
              className="hidden size-9 place-items-center rounded-sm text-tinta-tenue hover:text-tinta sm:grid">
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <button onClick={() => setMenu((v) => !v)} aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu} data-testid="menu"
              className="grid size-9 place-items-center rounded-sm border border-linea lg:hidden">
              {menu ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-linea bg-tarjeta lg:hidden" data-testid="menu-movel">
            <ul className="mx-auto max-w-7xl px-2 py-1.5">
              {LINKS.map(({ a, texto, Icone }) => (
                <li key={a}>
                  <NavLink to={a} end={a === "/"} onClick={() => setMenu(false)}
                    className={({ isActive }) =>
                      cx("flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm",
                        isActive ? "bg-marca-claro text-marca" : "text-tinta-media")}>
                    <Icone className="size-4" aria-hidden /> {texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4"><Outlet /></main>

      <footer className="border-t border-linea px-4 py-5">
        <p className="mx-auto max-w-7xl text-[11px] leading-relaxed text-tinta-tenue">
          Demonstração para avaliação. Os condomínios, administradoras, contatos, conversas e
          valores são inventados. Nenhuma API da Meta, do Google ou do Omie é chamada: nada é
          enviado a lugar nenhum. O que é real é a regra — a janela de 24 horas do WhatsApp, a
          troca de texto livre por modelo aprovado quando ela fecha, o custo por conversa iniciada
          pela empresa e a transferência entre departamentos com histórico.
          Justin Gnoh · outubro de 2026
        </p>
      </footer>
    </div>
  );
}
