import { useEffect, useState } from "react";

/**
 * O relógio como estado. A janela de 24 horas vence com a tela aberta, e um
 * prazo lido durante o render não vence sozinho: fecha só se outra coisa
 * provocar um novo render, o que pode nunca acontecer num plantão.
 */
export function useRelogio(intervaloMs = 30000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(t);
  }, [intervaloMs]);
  return agora;
}
