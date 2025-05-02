"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiSearch,
  FiCheck,
  FiHome,
  FiShoppingBag,
  FiDollarSign,
  FiGift,
} from "react-icons/fi";
import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  buscarTodosClientes,
  adicionarCompra,
  buscarCreditosAbertos,
  resgatarCreditos,
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

const PainelAdicionarCompra = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [valorCompra, setValorCompra] = useState("");
  const [enviandoCompra, setEnviandoCompra] = useState(false);
  const [verificandoCreditos, setVerificandoCreditos] = useState(false);
  const [creditosVerificados, setCreditosVerificados] = useState<{
    totalCreditos: number;
    compras: Array<{
      id: string;
      data: Date;
      valor: number;
      credito: number;
    }>;
    comprasExpiradas: number;
  } | null>(null);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [resgatandoCreditos, setResgatandoCreditos] = useState(false);

  const abrirModal = () => {
    setModalAberto(true);
  };

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setModalAberto(false);
    toast.success("Cliente selecionado com sucesso!");
  };

  // Função para formatar data
  const formatarData = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para formatar valor monetário enquanto o usuário digita
  const formatarValorMonetario = (valor: string) => {
    // Remove tudo que não for número
    let numero = valor.replace(/\D/g, "");

    // Converte para número e divide por 100 para obter o valor em reais
    const valorNumerico = parseInt(numero) / 100;

    // Formata o valor como moeda brasileira
    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Adicionando uma função para calcular o crédito
  const calcularCredito = () => {
    if (!clienteSelecionado || !valorCompra) return null;

    // Extrai apenas os números do valor formatado
    const valor = valorCompra.replace(/\D/g, "");
    if (!valor) return null;

    // Convertendo para número
    const valorNumerico = parseInt(valor) / 100;

    // NOVA LÓGICA: Verificar primeiro se existe "Crédito personalizado de X%" na lista de benefícios
    const creditoPersonalizado = clienteSelecionado.beneficios.find(
      (beneficio) => beneficio.startsWith("Crédito personalizado de")
    );

    if (creditoPersonalizado) {
      // Extrair o percentual do crédito personalizado
      const percentualMatch = creditoPersonalizado.match(/(\d+)%/);
      if (percentualMatch && percentualMatch[1]) {
        const percentual = parseInt(percentualMatch[1], 10);
        const valorCredito = valorNumerico * (percentual / 100);

        return {
          percentual: percentual,
          valor: valorCredito,
          valorFormatado: formatarValorMonetario(
            Math.round(valorCredito * 100).toString()
          ),
          tipo: "Crédito personalizado",
        };
      }
    }

    // LÓGICA ATUAL: Se não tiver crédito personalizado, verificar benefícios padrão
    // Verificar se o cliente tem o benefício em suas próprias propriedades
    const temBeneficioCredito = clienteSelecionado.beneficios.includes(
      "Sistema de economia com crédito"
    );

    // Verificar se o cliente tem o benefício nas propriedades da matriz
    const temBeneficioCreditoMatriz =
      clienteSelecionado.tipoCliente === "filiado" &&
      clienteSelecionado.beneficioMatriz?.includes(
        "Sistema de economia com crédito"
      );

    // Calcular o percentual de crédito
    let percentualCredito = 0;
    if (temBeneficioCredito) percentualCredito += 5;
    if (temBeneficioCreditoMatriz) percentualCredito += 5;

    // Se não tem nenhum benefício de crédito, retorna null
    if (percentualCredito === 0) return null;

    // Calcula o valor do crédito
    const valorCredito = valorNumerico * (percentualCredito / 100);

    return {
      percentual: percentualCredito,
      valor: valorCredito,
      valorFormatado: formatarValorMonetario(
        Math.round(valorCredito * 100).toString()
      ),
      tipo: "Sistema padrão",
    };
  };

  // Modificar o handleChangeValor para atualizar o valor do crédito
  const handleChangeValor = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Código existente para formatar o valor
    const valor = e.target.value.replace(/\D/g, "");

    if (!valor) {
      setValorCompra("");
      return;
    }

    const valorFormatado = formatarValorMonetario(valor);
    setValorCompra(valorFormatado);
  };

  // Adicionando função para verificar se a compra tem menos de 24 horas
  const ehIndisponivel = (dataCompra: Date) => {
    const vinte4Horas = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    return new Date().getTime() - new Date(dataCompra).getTime() < vinte4Horas;
  };

  // Modificar a função verificarBeneficios para também filtrar compras indisponíveis
  const verificarBeneficios = async () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente primeiro");
      return;
    }

    setVerificandoCreditos(true);
    setCreditosVerificados(null);

    try {
      const resultado = await buscarCreditosAbertos(clienteSelecionado.nome);

      if (resultado.success && resultado.data) {
        // Filtrar as compras indisponíveis antes de definir o state
        const resultadoFiltrado = {
          ...resultado.data,
          compras: resultado.data.compras.filter(
            (compra) => !ehIndisponivel(new Date(compra.data))
          ),
          // Recalcular o total de créditos excluindo as compras indisponíveis
          totalCreditos: resultado.data.compras
            .filter((compra) => !ehIndisponivel(new Date(compra.data)))
            .reduce((acc, compra) => acc + compra.credito, 0),
        };

        setCreditosVerificados(resultadoFiltrado);
        toast.success("Créditos verificados com sucesso!");
      } else {
        toast.error("Erro ao verificar créditos");
      }
    } catch (error) {
      console.error("Erro ao verificar créditos:", error);
      toast.error("Erro ao verificar créditos");
    } finally {
      setVerificandoCreditos(false);
    }
  };

  const handleAdicionarCompra = async () => {
    if (!clienteSelecionado || !valorCompra) {
      toast.error("Selecione um cliente e informe o valor da compra");
      return;
    }

    // Extrai apenas os números do valor formatado
    const valor = valorCompra.replace(/\D/g, "");
    if (!valor) {
      toast.error("Informe um valor de compra válido");
      return;
    }

    // Convertendo para número
    const valorNumerico = parseInt(valor) / 100;

    // Calcular o crédito
    const credito = calcularCredito();
    const valorCredito = credito ? credito.valor : 0;

    setEnviandoCompra(true);

    try {
      const resultado = await adicionarCompra({
        nome: clienteSelecionado.nome,
        valor: valorNumerico,
        credito: valorCredito,
      });

      if (resultado.success) {
        toast.success("Compra adicionada com sucesso!");
        // Limpar o formulário
        setClienteSelecionado(null);
        setValorCompra("");
      } else {
        toast.error("Erro ao adicionar compra. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao adicionar compra:", error);
      toast.error("Erro ao adicionar compra. Tente novamente.");
    } finally {
      setEnviandoCompra(false);
    }
  };

  const abrirModalHistorico = () => {
    if (!creditosVerificados || creditosVerificados.compras.length === 0) {
      toast("Não há compras para exibir");
      return;
    }
    setModalHistoricoAberto(true);
  };

  const handleResgatarCreditos = async () => {
    if (
      !clienteSelecionado ||
      !creditosVerificados ||
      creditosVerificados.totalCreditos <= 0
    ) {
      toast("Não há créditos disponíveis para resgate");
      return;
    }

    setResgatandoCreditos(true);

    try {
      const resultado = await resgatarCreditos(clienteSelecionado.nome);

      if (resultado.success) {
        toast.success(`Créditos resgatados com sucesso!`);
        // Atualizar os créditos verificados após o resgate
        verificarBeneficios();
      } else {
        toast.error("Erro ao resgatar créditos");
      }
    } catch (error) {
      console.error("Erro ao resgatar créditos:", error);
      toast.error("Erro ao resgatar créditos");
    } finally {
      setResgatandoCreditos(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4"
      >
        <h2 className="text-3xl font-bold text-emerald-700 mb-8 flex items-center gap-3">
          <FiShoppingBag className="text-2xl" />
          Adicionar Compra
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
            <>
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
                      Endereço:
                    </div>
                    <div className="font-medium text-gray-800">
                      {clienteSelecionado.endereco}
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

                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    Benefícios:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clienteSelecionado.beneficios.map((beneficio, index) => (
                      <span
                        key={index}
                        className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
                      >
                        {beneficio}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Exibir benefícios da matriz quando o cliente for do tipo filiado */}
                {clienteSelecionado.tipoCliente === "filiado" &&
                  clienteSelecionado.beneficioMatriz && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        Benefícios da Matriz:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {clienteSelecionado.beneficioMatriz.map(
                          (beneficio, index) => (
                            <span
                              key={index}
                              className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-sm"
                            >
                              {beneficio}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </motion.div>

              {/* Seção de Valor da Compra */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 border border-emerald-100 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center gap-2">
                  <FiDollarSign />
                  Detalhes da Compra
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor da Compra
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={valorCompra}
                        onChange={handleChangeValor}
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>

                  {/* Mostrar o crédito calculado se aplicável */}
                  {valorCompra && clienteSelecionado && calcularCredito() && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-emerald-50 rounded-lg border border-emerald-100"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-emerald-700">
                            Crédito ({calcularCredito()?.percentual}%):
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-emerald-600">
                          {calcularCredito()?.valorFormatado}
                        </div>
                      </div>
                      <p className="text-xs text-emerald-600 mt-1">
                        {calcularCredito()?.tipo === "Crédito personalizado"
                          ? "Benefício de crédito personalizado"
                          : calcularCredito()?.percentual === 10
                          ? "Benefício acumulado (cliente + matriz)"
                          : "Benefício de economia"}
                      </p>
                    </motion.div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex flex-col space-y-3 mt-4">
                    <button
                      type="button"
                      onClick={handleAdicionarCompra}
                      disabled={!valorCompra || enviandoCompra}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                        !valorCompra || enviandoCompra
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {enviandoCompra ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Processando...
                        </>
                      ) : (
                        <>
                          <FiShoppingBag className="text-lg" />
                          Adicionar Compra
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={verificarBeneficios}
                      disabled={verificandoCreditos || !clienteSelecionado}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                        verificandoCreditos || !clienteSelecionado
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200"
                      }`}
                    >
                      {verificandoCreditos ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-800"
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
                          Verificando...
                        </>
                      ) : (
                        <>
                          <FiGift className="text-lg" />
                          Verificar Benefícios
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {creditosVerificados && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-semibold text-blue-700">
                      Créditos Acumulados:
                    </h4>
                    <div className="text-xl font-bold text-blue-600">
                      {formatarValorMonetario(
                        Math.round(
                          creditosVerificados.totalCreditos * 100
                        ).toString()
                      )}
                    </div>
                  </div>

                  {creditosVerificados.compras.length > 0 ? (
                    <div className="text-sm text-blue-600">
                      Você possui {creditosVerificados.compras.length} compra(s)
                      com créditos disponíveis.
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600">
                      Não há créditos acumulados para uso.
                    </div>
                  )}

                  {creditosVerificados.comprasExpiradas > 0 && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
                      <span className="font-medium">Atenção:</span>{" "}
                      {creditosVerificados.comprasExpiradas} compra(s) com
                      créditos expirados (mais de 30 dias).
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex flex-col space-y-3 mt-4">
                    {/* Botão de Resgatar Crédito */}
                    <button
                      type="button"
                      onClick={handleResgatarCreditos}
                      disabled={
                        resgatandoCreditos ||
                        creditosVerificados.totalCreditos <= 0
                      }
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                        resgatandoCreditos ||
                        creditosVerificados.totalCreditos <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {resgatandoCreditos ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Processando...
                        </>
                      ) : (
                        <>
                          <FiGift className="text-lg" />
                          Resgatar Crédito
                        </>
                      )}
                    </button>

                    {/* Botão de Histórico de Compras */}
                    <button
                      type="button"
                      onClick={abrirModalHistorico}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <FiShoppingBag className="text-lg" />
                      Histórico de Compras do Cliente
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Modal de Busca */}
      <ModalBuscaCliente
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSelectCliente={selecionarCliente}
      />

      {/* Modal de Histórico de Compras */}
      <AnimatePresence>
        {modalHistoricoAberto && creditosVerificados && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setModalHistoricoAberto(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-2">
                  <FiShoppingBag className="text-xl" />
                  Histórico de Compras - {clienteSelecionado?.nome}
                </h3>

                <div className="overflow-y-auto flex-grow mb-6">
                  {creditosVerificados.compras.length > 0 ? (
                    <div className="space-y-4">
                      {creditosVerificados.compras
                        .filter((compra) => !ehIndisponivel(compra.data))
                        .map((compra) => {
                          // Verificar se a compra foi há mais de 30 dias
                          const dataCompra = new Date(compra.data);
                          const dataLimite = new Date();
                          dataLimite.setDate(dataLimite.getDate() - 30);
                          const estaExpirado = dataCompra < dataLimite;

                          return (
                            <div
                              key={compra.id}
                              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                estaExpirado
                                  ? "bg-orange-50 border-orange-100"
                                  : "bg-blue-50 border-blue-100"
                              }`}
                            >
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Data:
                                </span>
                                <span className="font-medium text-gray-800">
                                  {new Date(compra.data).toLocaleDateString(
                                    "pt-BR",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Valor da Compra:
                                </span>
                                <span className="font-medium text-gray-800">
                                  {formatarValorMonetario(
                                    Math.round(compra.valor * 100).toString()
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Crédito Gerado:
                                </span>
                                <span className="font-semibold text-emerald-600">
                                  {formatarValorMonetario(
                                    Math.round(compra.credito * 100).toString()
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">
                                  Status:
                                </span>
                                <span
                                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                    estaExpirado
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {estaExpirado
                                    ? "Expirado (mais de 30 dias)"
                                    : "Crédito Disponível"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhuma compra encontrada</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-blue-700">
                    Total: {creditosVerificados.compras.length} compra(s)
                  </div>

                  <button
                    onClick={() => setModalHistoricoAberto(false)}
                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PainelAdicionarCompra;
