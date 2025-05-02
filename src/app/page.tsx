import Sidebar from "../components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm p-8 h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-700 mb-4">
              Bem-vindo ao Sistema de Fidelidade
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Selecione uma opção no menu lateral para começar a gerenciar o
              programa de fidelidade EcoClean.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
