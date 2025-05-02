import PainelHistoricoCompras from "@/components/PainelHistoricoCompras";
import Sidebar from "@/components/Sidebar";

export default function HistoricoComprasPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 flex justify-center">
        <PainelHistoricoCompras />
      </main>
    </div>
  );
}
