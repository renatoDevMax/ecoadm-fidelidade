import PainelProdutos from "../../components/PainelProdutos";
import Sidebar from "../../components/Sidebar";

export default function ProdutosPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <PainelProdutos />
        </div>
      </main>
    </div>
  );
}
