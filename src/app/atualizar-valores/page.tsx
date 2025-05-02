import PainelAtualizarValores from "../../components/PainelAtualizarValores";
import Sidebar from "../../components/Sidebar";

export default function AtualizarValoresPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <PainelAtualizarValores />
        </div>
      </main>
    </div>
  );
}
