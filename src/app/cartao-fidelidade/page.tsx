import Sidebar from "@/components/Sidebar";
import PainelCartaoFidelidade from "@/components/PainelCartaoFidelidade";

export default function CartaoFidelidadePage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 flex items-center justify-center">
        <PainelCartaoFidelidade />
      </main>
    </div>
  );
}
