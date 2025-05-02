"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiCheck, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { buscarTodosClientes } from "../app/actions";

// Definindo o tipo para os clientes
type Cliente = {
  id: string;
  nome: string;
  cpfcnpj: string;
  endereco: string;
  contato: string;
  beneficios: string[];
  tipoCliente: string;
  matriz?: string;
  beneficioMatriz?: string[];
  dataCadastro: Date;
  email?: string;
  senha?: string;
};

type ModalBuscaClienteProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectCliente: (cliente: Cliente) => void;
};

const ModalBuscaCliente = ({
  isOpen,
  onClose,
  onSelectCliente,
}: ModalBuscaClienteProps) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroClientes, setFiltroClientes] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Filtrar clientes com base no texto de busca
  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(filtroClientes.toLowerCase())
  );

  // Carregar clientes quando o modal for aberto
  useEffect(() => {
    if (isOpen) {
      buscarClientes();
    }
  }, [isOpen]);

  const buscarClientes = async () => {
    setCarregando(true);

    try {
      const resultado = await buscarTodosClientes();

      if (resultado.success && resultado.data) {
        setClientes(resultado.data);
      } else {
        toast.error("Erro ao buscar clientes");
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao buscar clientes");
    } finally {
      setCarregando(false);
    }
  };

  const handleSelectCliente = (cliente: Cliente) => {
    onSelectCliente(cliente);
    onClose();
    toast.success("Cliente selecionado com sucesso!");
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={() => !carregando && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
          {carregando ? (
            <>
              <div className="w-16 h-16 mb-6">
                <svg
                  className="animate-spin w-full h-full text-emerald-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-emerald-700 mb-2">
                Buscando clientes
              </h3>
              <p className="text-gray-500 text-sm text-center">
                Aguarde enquanto localizamos os clientes...
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-xl font-bold text-emerald-700">
                  Selecione um Cliente
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="w-full mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Filtrar clientes..."
                    value={filtroClientes}
                    onChange={(e) => setFiltroClientes(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900"
                    autoFocus
                  />
                </div>
              </div>

              {clientesFiltrados.length > 0 ? (
                <div className="w-full max-h-80 overflow-y-auto mb-4 pr-1">
                  <ul className="divide-y divide-gray-100 w-full">
                    {clientesFiltrados.map((cliente) => (
                      <li key={cliente.id}>
                        <button
                          onClick={() => handleSelectCliente(cliente)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50 rounded-lg transition-colors group"
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-gray-800">
                              {cliente.nome}
                            </span>
                            <span className="text-sm text-gray-500">
                              {cliente.cpfcnpj}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-3 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                              {cliente.tipoCliente === "matriz"
                                ? "Matriz"
                                : "Filiado"}
                            </span>
                            <FiCheck className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8 w-full">
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ModalBuscaCliente;
