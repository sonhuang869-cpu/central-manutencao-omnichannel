import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Armacao from "@/components/Armacao";
import Caixa from "@/pages/Caixa";
import Funil from "@/pages/Funil";
import Automacoes from "@/pages/Automacoes";
import Clientes from "@/pages/Clientes";
import NaoEncontrado from "@/pages/NaoEncontrado";
import { useApp } from "@/estado";

export default function App() {
  const carregar = useApp((s) => s.carregar);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <>
      <Routes>
        <Route element={<Armacao />}>
          <Route path="/" element={<Caixa />} />
          <Route path="/funil" element={<Funil />} />
          <Route path="/automacoes" element={<Automacoes />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
