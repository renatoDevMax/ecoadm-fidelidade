"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiSearch,
  FiCheck,
  FiShoppingBag,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiArrowDown,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiX,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";
import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  buscarTodosClientes,
  buscarTodasCompras,
  atualizarCompra,
  deletarCompra,
} from "../app/actions";
import ModalBuscaCliente from "./ModalBuscaCliente";

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
};

// Definindo o tipo para as compras
type Compra = {
  id: string;
  data: Date;
  valor: number;
  credito: number;
  statusCred: string;
};

// Definindo o tipo para o histórico de compras
type HistoricoCompras = {
  compras: Compra[];
  totalCreditosAbertos: number;
  totalCreditosResgatados: number;
  totalCreditosIndisponiveis: number;
  totalCompras: number;
};

const PainelHistoricoCompras = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [historicoCompras, setHistoricoCompras] =
    useState<HistoricoCompras | null>(null);
  const [buscandoHistorico, setBuscandoHistorico] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos"); // 'todos', 'aberto', 'expirado', 'resgatado'
  const [compraEditando, setCompraEditando] = useState<Compra | null>(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [valorCompraEdicao, setValorCompraEdicao] = useState("");
  const [creditoCompraEdicao, setCreditoCompraEdicao] = useState("");
  const [statusCompraEdicao, setStatusCompraEdicao] = useState("");
  const [atualizandoCompra, setAtualizandoCompra] = useState(false);
  const [excluindoCompra, setExcluindoCompra] = useState(false);

  // Definir a função estaExpirada antes de usá-la
  const estaExpirada = (dataCompra: Date) => {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    return new Date(dataCompra) < dataLimite;
  };

  // Adicionar função para verificar se a compra tem menos de 24 horas
  const ehIndisponivel = (dataCompra: Date) => {
    const dataLimite = new Date();
    const vinte4Horas = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    return new Date().getTime() - new Date(dataCompra).getTime() < vinte4Horas;
  };

  // Agora use a função na lógica de filtragem
  const comprasFiltradas = historicoCompras
    ? filtroStatus === "todos"
      ? historicoCompras.compras
      : filtroStatus === "expirado"
      ? historicoCompras.compras.filter(
          (compra) =>
            compra.statusCred === "aberto" &&
            estaExpirada(compra.data) &&
            !ehIndisponivel(compra.data)
        )
      : filtroStatus === "aberto"
      ? historicoCompras.compras.filter(
          (compra) =>
            compra.statusCred === "aberto" &&
            !estaExpirada(compra.data) &&
            !ehIndisponivel(compra.data)
        )
      : filtroStatus === "indisponivel"
      ? historicoCompras.compras.filter((compra) => ehIndisponivel(compra.data))
      : historicoCompras.compras.filter(
          (compra) =>
            compra.statusCred === "resgatado" && !ehIndisponivel(compra.data)
        )
    : [];

  const abrirModal = () => {
    setModalAberto(true);
  };

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    buscarHistorico(cliente.nome);
    toast.success("Cliente selecionado com sucesso!");
  };

  const buscarHistorico = async (nomeCliente: string) => {
    setBuscandoHistorico(true);
    setHistoricoCompras(null);

    try {
      const resultado = await buscarTodasCompras(nomeCliente);

      if (resultado.success && resultado.data) {
        // Calcular o total de créditos indisponíveis
        const comprasIndisponiveis = resultado.data.compras.filter((compra) =>
          ehIndisponivel(compra.data)
        );

        const totalCreditosIndisponiveis = comprasIndisponiveis.reduce(
          (total, compra) => total + compra.credito,
          0
        );

        // Adicionar o valor ao histórico
        setHistoricoCompras({
          ...resultado.data,
          totalCreditosIndisponiveis,
        });
      } else {
        toast.error("Erro ao buscar histórico de compras");
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast.error("Erro ao buscar histórico de compras");
    } finally {
      setBuscandoHistorico(false);
    }
  };

  // Função para formatar data
  const formatarData = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para formatar data e hora
  const formatarDataHora = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para formatar valor monetário
  const formatarValorMonetario = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Adicione um botão para filtrar apenas compras expiradas
  <button
    onClick={() => setFiltroStatus("expirado")}
    className={`px-4 py-2 text-sm rounded-full transition-colors ${
      filtroStatus === "expirado"
        ? "bg-orange-600 text-white"
        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
    }`}
  >
    Créditos Expirados
  </button>;

  const abrirModalEdicao = (compra: Compra) => {
    setCompraEditando(compra);
    setValorCompraEdicao(formatarValorParaReais(compra.valor));
    setCreditoCompraEdicao(formatarValorParaReais(compra.credito));
    setStatusCompraEdicao(compra.statusCred);
    setModalEdicaoAberto(true);
  };

  const formatarValorParaReais = (valor: number) => {
    return valor.toFixed(2).replace(".", ",");
  };

  const converterValorParaNumero = (valor: string) => {
    // Remove símbolos de moeda e espaços
    const valorLimpo = valor.replace(/[^\d,\.]/g, "");
    // Converte vírgula para ponto e retorna como número
    return parseFloat(valorLimpo.replace(",", "."));
  };

  const salvarEdicaoCompra = async () => {
    if (!compraEditando) return;

    setAtualizandoCompra(true);

    try {
      // Chamaremos a server action para atualizar a compra
      /* A implementar no arquivo actions.ts */
      const resultado = await atualizarCompra({
        id: compraEditando.id,
        valor: converterValorParaNumero(valorCompraEdicao),
        credito: converterValorParaNumero(creditoCompraEdicao),
        statusCred: statusCompraEdicao,
      });

      if (resultado.success) {
        toast.success("Compra atualizada com sucesso!");
        setModalEdicaoAberto(false);
        // Recarrega o histórico para mostrar as alterações
        if (clienteSelecionado) {
          buscarHistorico(clienteSelecionado.nome);
        }
      } else {
        toast.error("Erro ao atualizar compra");
      }
    } catch (error) {
      console.error("Erro ao atualizar compra:", error);
      toast.error("Erro ao atualizar compra");
    } finally {
      setAtualizandoCompra(false);
    }
  };

  const excluirCompra = async () => {
    if (!compraEditando) return;

    setExcluindoCompra(true);

    try {
      // Chamaremos a server action para excluir a compra
      /* A implementar no arquivo actions.ts */
      const resultado = await deletarCompra(compraEditando.id);

      if (resultado.success) {
        toast.success("Compra excluída com sucesso!");
        setModalEdicaoAberto(false);
        // Recarrega o histórico para atualizar a lista
        if (clienteSelecionado) {
          buscarHistorico(clienteSelecionado.nome);
        }
      } else {
        toast.error("Erro ao excluir compra");
      }
    } catch (error) {
      console.error("Erro ao excluir compra:", error);
      toast.error("Erro ao excluir compra");
    } finally {
      setExcluindoCompra(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl w-full mx-4"
      >
        <h2 className="text-3xl font-bold text-emerald-700 mb-8 flex items-center gap-3">
          <FiShoppingBag className="text-2xl" />
          Histórico de Compras
        </h2>

        <div className="space-y-6">
          <div className="mb-4">
            <button
              type="button"
              onClick={abrirModal}
              className="flex items-center justify-center gap-2 w-full bg-emerald-100 text-emerald-800 py-3 px-6 rounded-lg font-medium hover:bg-emerald-200 transition-colors border border-emerald-200"
            >
              <FiSearch className="text-lg" />
              Localizar Cliente
            </button>
          </div>

          {/* Exibir cliente selecionado */}
          {clienteSelecionado && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 mb-4 bg-emerald-50 border border-emerald-100 rounded-lg"
            >
              <div className="flex items-center mb-4">
                <div className="bg-emerald-100 p-2 rounded-full mr-3">
                  <FiUser className="text-emerald-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-emerald-700">
                    {clienteSelecionado.nome}
                  </h3>
                  <div className="text-sm font-medium text-emerald-600">
                    {clienteSelecionado.tipoCliente === "matriz"
                      ? "Cliente Matriz"
                      : "Cliente Filiado"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">
                    CPF/CNPJ:
                  </div>
                  <div className="font-medium text-gray-800">
                    {clienteSelecionado.cpfcnpj}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">
                    Contato:
                  </div>
                  <div className="font-medium text-gray-800">
                    {clienteSelecionado.contato}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">
                    Data de Cadastro:
                  </div>
                  <div className="font-medium text-gray-800">
                    {formatarData(clienteSelecionado.dataCadastro)}
                  </div>
                </div>

                {clienteSelecionado.matriz && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">
                      Matriz:
                    </div>
                    <div className="font-medium text-gray-800">
                      {clienteSelecionado.matriz}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Estado de carregamento para o histórico */}
          {buscandoHistorico && (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 mb-4">
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
              <p className="text-emerald-700 font-medium">
                Carregando histórico de compras...
              </p>
            </div>
          )}

          {/* Exibir histórico de compras */}
          {!buscandoHistorico && historicoCompras && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Resumo e filtros */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Total de Compras
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {historicoCompras.totalCompras}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Créditos Disponíveis
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatarValorMonetario(
                        historicoCompras.totalCreditosAbertos
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Créditos Indisponíveis
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatarValorMonetario(
                        historicoCompras.totalCreditosIndisponiveis || 0
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Créditos Resgatados
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatarValorMonetario(
                        historicoCompras.totalCreditosResgatados
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Total de Créditos
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatarValorMonetario(
                        historicoCompras.totalCreditosAbertos +
                          historicoCompras.totalCreditosResgatados +
                          (historicoCompras.totalCreditosIndisponiveis || 0)
                      )}
                    </div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-sm font-medium text-gray-700 flex items-center">
                    <FiFilter className="mr-2" /> Filtrar por:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFiltroStatus("todos")}
                      className={`px-4 py-2 text-sm rounded-full transition-colors ${
                        filtroStatus === "todos"
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFiltroStatus("aberto")}
                      className={`px-4 py-2 text-sm rounded-full transition-colors ${
                        filtroStatus === "aberto"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      Créditos Disponíveis
                    </button>
                    <button
                      onClick={() => setFiltroStatus("resgatado")}
                      className={`px-4 py-2 text-sm rounded-full transition-colors ${
                        filtroStatus === "resgatado"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      Créditos Resgatados
                    </button>
                    <button
                      onClick={() => setFiltroStatus("expirado")}
                      className={`px-4 py-2 text-sm rounded-full transition-colors ${
                        filtroStatus === "expirado"
                          ? "bg-orange-600 text-white"
                          : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                      }`}
                    >
                      Créditos Expirados
                    </button>
                    <button
                      onClick={() => setFiltroStatus("indisponivel")}
                      className={`px-4 py-2 text-sm rounded-full transition-colors border-2 ${
                        filtroStatus === "indisponivel"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                      }`}
                    >
                      Créditos Indisponíveis
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de compras */}
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Compras{" "}
                    {filtroStatus !== "todos" && (
                      <span className="text-sm font-normal">
                        (filtrado por:{" "}
                        {filtroStatus === "aberto"
                          ? "disponíveis"
                          : filtroStatus === "resgatado"
                          ? "resgatados"
                          : filtroStatus === "expirado"
                          ? "expirados"
                          : "indisponíveis"}
                        )
                      </span>
                    )}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {comprasFiltradas.length} registro(s)
                  </div>
                </div>

                {comprasFiltradas.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Data
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Valor
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Crédito
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {comprasFiltradas.map((compra) => (
                          <tr
                            key={compra.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatarDataHora(compra.data)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatarValorMonetario(compra.valor)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-emerald-600">
                                {formatarValorMonetario(compra.credito)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  ehIndisponivel(compra.data)
                                    ? "bg-purple-100 text-purple-800"
                                    : compra.statusCred === "aberto"
                                    ? estaExpirada(compra.data)
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {ehIndisponivel(compra.data)
                                  ? "Indisponível"
                                  : compra.statusCred === "aberto"
                                  ? estaExpirada(compra.data)
                                    ? "Expirado"
                                    : "Disponível"
                                  : "Resgatado"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => abrirModalEdicao(compra)}
                                className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded-full hover:bg-emerald-50"
                                title="Editar compra"
                              >
                                <FiEdit size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                    <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Nenhuma compra encontrada
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {filtroStatus !== "todos"
                        ? `Não há compras com status "${
                            filtroStatus === "aberto"
                              ? "disponível"
                              : filtroStatus === "resgatado"
                              ? "resgatado"
                              : filtroStatus === "expirado"
                              ? "expirado"
                              : "indisponível"
                          }".`
                        : "Este cliente ainda não possui compras registradas."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Estado vazio - sem cliente selecionado */}
          {!clienteSelecionado && !buscandoHistorico && (
            <div className="text-center py-16">
              <FiUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum cliente selecionado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um cliente para visualizar seu histórico de compras.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal de Busca */}
      <ModalBuscaCliente
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSelectCliente={selecionarCliente}
      />

      {/* Modal de Edição de Compra */}
      <AnimatePresence>
        {modalEdicaoAberto && compraEditando && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() =>
                !atualizandoCompra &&
                !excluindoCompra &&
                setModalEdicaoAberto(false)
              }
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
                    <FiEdit /> Editar Compra
                  </h3>
                  <button
                    onClick={() => setModalEdicaoAberto(false)}
                    disabled={atualizandoCompra || excluindoCompra}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data da Compra
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-700 border border-gray-200">
                      {new Date(compraEditando.data).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      A data não pode ser alterada
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor da Compra
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <input
                        type="text"
                        value={valorCompraEdicao}
                        onChange={(e) => setValorCompraEdicao(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-lg border focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900"
                        placeholder="0,00"
                        disabled={atualizandoCompra || excluindoCompra}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crédito Gerado
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <input
                        type="text"
                        value={creditoCompraEdicao}
                        onChange={(e) => setCreditoCompraEdicao(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-lg border focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900"
                        placeholder="0,00"
                        disabled={atualizandoCompra || excluindoCompra}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status do Crédito
                    </label>
                    <select
                      value={statusCompraEdicao}
                      onChange={(e) => setStatusCompraEdicao(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900"
                      disabled={atualizandoCompra || excluindoCompra}
                    >
                      <option value="aberto">Disponível</option>
                      <option value="resgatado">Resgatado</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      type="button"
                      onClick={salvarEdicaoCompra}
                      disabled={atualizandoCompra || excluindoCompra}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium ${
                        atualizandoCompra
                          ? "bg-gray-300 text-gray-500"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      } transition-colors`}
                    >
                      {atualizandoCompra ? (
                        <>Salvando...</>
                      ) : (
                        <>
                          <FiSave /> Salvar Alterações
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={excluirCompra}
                      disabled={atualizandoCompra || excluindoCompra}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium ${
                        excluindoCompra
                          ? "bg-gray-300 text-gray-500"
                          : "bg-red-600 text-white hover:bg-red-700"
                      } transition-colors`}
                    >
                      {excluindoCompra ? (
                        <>Excluindo...</>
                      ) : (
                        <>
                          <FiTrash2 /> Excluir Compra
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalEdicaoAberto(false)}
                      disabled={atualizandoCompra || excluindoCompra}
                      className="w-full py-3 px-6 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PainelHistoricoCompras;
