import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

export default function NaoEncontrado() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <SearchX className="size-10 text-tinta-tenue" aria-hidden />
      <h1 className="text-xl font-bold">Esta tela não existe</h1>
      <p className="max-w-sm text-sm text-tinta-media">
        O endereço que você abriu não corresponde a nenhuma tela do sistema.
      </p>
      <Link to="/" className="mt-1 inline-flex min-h-10 items-center rounded-sm bg-marca px-4 text-sm font-semibold text-white">
        Ir para o atendimento
      </Link>
    </div>
  );
}
