import { create } from "zustand";
import * as api from "@/lib/api";
import type { Atendente, Dados } from "@/lib/tipos";

interface Estado {
  dados: Dados | null;
  carregando: boolean;
  carregar: () => Promise<void>;
  aplicar: (d: Dados) => void;
  eu: () => Atendente | null;
  restaurar: () => Promise<void>;
}

export const useApp = create<Estado>((set, get) => ({
  dados: null,
  carregando: true,
  carregar: async () => {
    set({ carregando: true });
    try {
      set({ dados: await api.obterDados() });
    } finally {
      set({ carregando: false });
    }
  },
  aplicar: (d) => set({ dados: d }),
  eu: () => {
    const d = get().dados;
    return d ? d.atendentes.find((a) => a.id === d.sessaoId) ?? null : null;
  },
  restaurar: async () => set({ dados: await api.restaurar() }),
}));
