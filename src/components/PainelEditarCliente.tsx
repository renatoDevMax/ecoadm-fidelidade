"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiSearch,
  FiCheck,
  FiEdit,
  FiMail,
  FiLock,
  FiSave,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import { FormEvent, useState, ChangeEvent, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  buscarTodosClientes,
  atualizarCliente,
  buscarClientesMatriz,
  excluirCliente,
} from "../app/actions";

// Tipo para os clientes
type Cliente = {
  id: string;
  nome: string;
  cpfcnpj: string;
  endereco: string;
  contato: string;
  beneficios: string[];
  tipoCliente: string;
  email: string;
  senha: string;
  matriz?: string;
  beneficioMatriz?: string[];
  dataCadastro: string;
};

// Tipo para os clientes matriz para seleção
type ClienteMatriz = {
  id: string;
  nome: string;
  beneficios: string[];
};

const PainelEditarCliente = () => {
  // Estados do cliente
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Estado para a matriz (caso seja um cliente filiado)
  const [matrizSelecionada, setMatrizSelecionada] =
    useState<ClienteMatriz | null>(null);
  const [modalMatrizAberto, setModalMatrizAberto] = useState(false);
  const [clientesMatriz, setClientesMatriz] = useState<ClienteMatriz[]>([]);
  const [carregandoMatriz, setCarregandoMatriz] = useState(false);
  const [filtroMatriz, setFiltroMatriz] = useState("");

  // Estados do modal principal
  const [modalAberto, setModalAberto] = useState(false);
  const [todosClientes, setTodosClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtroClientes, setFiltroClientes] = useState("");

  // Estado para o modal de confirmação de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Funções de formatação
  const formatarCpfCnpj = (valor: string) => {
    // Remove todos os caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, "");

    if (apenasNumeros.length <= 11) {
      // Formatar como CPF: XXX.XXX.XXX-XX
      const cpfFormatado = apenasNumeros.replace(
        /^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/,
        (_, g1, g2, g3, g4) => {
          let resultado = g1;
          if (g2) resultado += `.${g2}`;
          if (g3) resultado += `.${g3}`;
          if (g4) resultado += `-${g4}`;
          return resultado;
        }
      );
      return cpfFormatado;
    } else {
      // Formatar como CNPJ: XX.XXX.XXX/XXXX-XX
      const cnpjFormatado = apenasNumeros.replace(
        /^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/,
        (_, g1, g2, g3, g4, g5) => {
          let resultado = g1;
          if (g2) resultado += `.${g2}`;
          if (g3) resultado += `.${g3}`;
          if (g4) resultado += `/${g4}`;
          if (g5) resultado += `-${g5}`;
          return resultado;
        }
      );
      return cnpjFormatado;
    }
  };

  const formatarTelefone = (valor: string) => {
    // Remove todos os caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, "");

    // Verifica se é celular (com 9 dígitos) ou telefone fixo (com 8 dígitos)
    if (apenasNumeros.length <= 10) {
      // Formatar como telefone fixo: (XX) XXXX-XXXX
      const telefoneFormatado = apenasNumeros.replace(
        /^(\d{0,2})(\d{0,4})(\d{0,4})$/,
        (_, ddd, parte1, parte2) => {
          let resultado = "";
          if (ddd) resultado += `(${ddd}`;
          if (ddd) resultado += ") ";
          if (parte1) resultado += parte1;
          if (parte2) resultado += `-${parte2}`;
          return resultado;
        }
      );
      return telefoneFormatado;
    } else {
      // Formatar como celular: (XX) XXXXX-XXXX
      const celularFormatado = apenasNumeros.replace(
        /^(\d{0,2})(\d{0,5})(\d{0,4})$/,
        (_, ddd, parte1, parte2) => {
          let resultado = "";
          if (ddd) resultado += `(${ddd}`;
          if (ddd) resultado += ") ";
          if (parte1) resultado += parte1;
          if (parte2) resultado += `-${parte2}`;
          return resultado;
        }
      );
      return celularFormatado;
    }
  };

  // Handlers para os inputs
  const handleCpfCnpjChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    const valorFormatado = formatarCpfCnpj(valorDigitado);
    setCpfCnpj(valorFormatado);
  };

  const handleTelefoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    const valorFormatado = formatarTelefone(valorDigitado);
    setTelefone(valorFormatado);
  };

  const toggleBeneficio = (beneficio: string) => {
    setBeneficios((prev) =>
      prev.includes(beneficio)
        ? prev.filter((b) => b !== beneficio)
        : [...prev, beneficio]
    );
  };

  // Função para abrir o modal de busca de clientes
  const abrirModal = async () => {
    setModalAberto(true);
    setCarregando(true);
    setFiltroClientes("");

    try {
      const resultado = await buscarTodosClientes();

      if (resultado.success && resultado.data) {
        // Cast para any para contornar verificação de tipo
        const clientesCompletosMapeados = resultado.data.map(
          (cliente: any) => ({
            ...cliente,
            email: cliente.email || "",
            senha: cliente.senha || "",
          })
        );
        setTodosClientes(clientesCompletosMapeados);
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

  // Função para abrir o modal de busca de matriz (para clientes filiados)
  const abrirModalMatriz = async () => {
    setModalMatrizAberto(true);
    setCarregandoMatriz(true);

    try {
      const resultado = await buscarClientesMatriz();

      if (resultado.success && resultado.data) {
        setClientesMatriz(resultado.data);
      } else {
        toast.error("Erro ao buscar clientes matriz");
      }
    } catch (error) {
      console.error("Erro ao buscar clientes matriz:", error);
      toast.error("Erro ao buscar clientes matriz");
    } finally {
      setCarregandoMatriz(false);
    }
  };

  // Função para selecionar um cliente
  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setNome(cliente.nome);
    setCpfCnpj(cliente.cpfcnpj);
    setEndereco(cliente.endereco);
    setTelefone(cliente.contato);
    setEmail(cliente.email || "");
    setSenha(cliente.senha || "");
    setBeneficios(cliente.beneficios || []);

    // Se for um cliente filiado, definir a matriz
    if (cliente.tipoCliente === "filiado" && cliente.matriz) {
      setMatrizSelecionada({
        id: "", // Não temos o ID da matriz neste momento
        nome: cliente.matriz,
        beneficios: cliente.beneficioMatriz || [],
      });
    } else {
      setMatrizSelecionada(null);
    }

    setModalAberto(false);
    toast.success("Cliente selecionado com sucesso!");
  };

  // Função para selecionar matriz (para clientes filiados)
  const selecionarMatriz = (matriz: ClienteMatriz) => {
    setMatrizSelecionada(matriz);
    setModalMatrizAberto(false);
    toast.success("Matriz selecionada com sucesso!");
  };

  // Filtrar clientes pelo nome
  const clientesFiltrados = todosClientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(filtroClientes.toLowerCase())
  );

  // Filtrar matrizes pelo nome
  const matrizFiltradas = clientesMatriz.filter((matriz) =>
    matriz.nome.toLowerCase().includes(filtroMatriz.toLowerCase())
  );

  // Submit para atualizar o cliente
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionado) {
      toast.error("Selecione um cliente primeiro");
      return;
    }

    setIsSubmitting(true);

    try {
      const dadosAtualizados = {
        id: clienteSelecionado.id,
        nome,
        cpfcnpj: cpfCnpj,
        endereco,
        contato: telefone,
        email,
        senha,
        beneficios,
        tipoCliente: clienteSelecionado.tipoCliente,
        ...(clienteSelecionado.tipoCliente === "filiado" && matrizSelecionada
          ? {
              matriz: matrizSelecionada.nome,
              beneficioMatriz: matrizSelecionada.beneficios,
            }
          : {}),
      };

      const resultado = await atualizarCliente(dadosAtualizados);

      if (resultado.success) {
        toast.success("Cliente atualizado com sucesso!");
        setClienteSelecionado(null);
        resetForm();
      } else {
        toast.error(`Erro ao atualizar cliente: ${resultado.error}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetar o formulário
  const resetForm = () => {
    setNome("");
    setCpfCnpj("");
    setEndereco("");
    setTelefone("");
    setEmail("");
    setSenha("");
    setBeneficios([]);
    setMatrizSelecionada(null);
    setClienteSelecionado(null);
  };

  // Função para excluir o cliente selecionado
  const handleExcluirCliente = async () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente primeiro");
      return;
    }

    setExcluindo(true);

    try {
      const resultado = await excluirCliente(
        clienteSelecionado.id,
        clienteSelecionado.tipoCliente
      );

      if (resultado.success) {
        toast.success("Cliente excluído com sucesso!");
        setModalExclusaoAberto(false);
        resetForm();
      } else {
        toast.error(`Erro ao excluir cliente: ${resultado.error}`);
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    } finally {
      setExcluindo(false);
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
          <FiEdit className="text-2xl" />
          Editar Cliente
        </h2>

        <div className="mb-6">
          <button
            type="button"
            onClick={abrirModal}
            className="flex items-center justify-center gap-2 w-full bg-emerald-100 text-emerald-800 py-3 px-6 rounded-lg font-medium hover:bg-emerald-200 transition-colors border border-emerald-200"
          >
            <FiSearch className="text-lg" />
            Localizar Cliente
          </button>
        </div>

        {clienteSelecionado && (
          <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="font-medium text-emerald-800">
              Cliente Selecionado
            </div>
            <div className="text-xl font-semibold text-emerald-700">
              {clienteSelecionado.nome}
            </div>
            <div className="text-sm text-emerald-600">
              {clienteSelecionado.tipoCliente === "matriz"
                ? "Cliente Matriz"
                : "Cliente Filiado"}
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Digite o nome completo"
                  required
                  disabled={!clienteSelecionado}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF/CNPJ
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="cpfcnpj"
                  value={cpfCnpj}
                  onChange={handleCpfCnpjChange}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  required
                  disabled={!clienteSelecionado}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Digite o endereço completo"
                  required
                  disabled={!clienteSelecionado}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contato
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="contato"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="(00) 00000-0000"
                  required
                  disabled={!clienteSelecionado}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="exemplo@ecoclean.com.br"
                  required
                  disabled={!clienteSelecionado}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Digite uma senha segura"
                  required
                  disabled={!clienteSelecionado}
                />
              </div>
            </div>

            {clienteSelecionado &&
              clienteSelecionado.tipoCliente === "filiado" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matriz
                  </label>
                  <button
                    type="button"
                    onClick={abrirModalMatriz}
                    className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 py-3 px-6 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                    disabled={!clienteSelecionado}
                  >
                    <FiSearch className="text-lg" />
                    {matrizSelecionada
                      ? `Trocar Matriz: ${matrizSelecionada.nome}`
                      : "Selecionar Matriz"}
                  </button>
                </div>
              )}
          </div>

          {/* Seção de Benefícios */}
          <div className="space-y-4 pt-4 border-t border-emerald-50">
            <h3 className="text-lg font-semibold text-emerald-700 mb-4">
              Benefícios Disponíveis
            </h3>

            <div className="space-y-3">
              {[
                "Sistema de economia com crédito",
                "Entrega com prioridade",
                "Flexibilidade no pagamento",
                "Acesso ao EcoClean Descomplica Piscinas",
              ].map((beneficio) => (
                <label
                  key={beneficio}
                  className={`flex items-center space-x-3 group cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-emerald-50 ${
                    !clienteSelecionado ? "opacity-50" : ""
                  }`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={beneficios.includes(beneficio)}
                      onChange={() => toggleBeneficio(beneficio)}
                      disabled={!clienteSelecionado}
                    />
                    <div className="w-5 h-5 border-2 border-emerald-300 rounded-md flex items-center justify-center transition-all group-hover:border-emerald-500">
                      <svg
                        className={`w-3 h-3 text-emerald-600 transition-opacity ${
                          beneficios.includes(beneficio)
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-gray-700 font-medium">{beneficio}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !clienteSelecionado}
            className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              isSubmitting || !clienteSelecionado
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <FiSave className="text-lg" />
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>

        {/* Botão Excluir Cliente */}
        {clienteSelecionado && (
          <button
            type="button"
            onClick={() => setModalExclusaoAberto(true)}
            className="w-full mt-4 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
          >
            <FiTrash2 className="text-lg" />
            Excluir Cliente
          </button>
        )}
      </motion.div>

      {/* Modal de Busca de Clientes */}
      <AnimatePresence>
        {modalAberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => !carregando && setModalAberto(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center max-h-[600px]">
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
                    <h3 className="text-xl font-bold text-emerald-700 mb-4 self-start">
                      Selecione um Cliente
                    </h3>

                    <div className="w-full mb-4">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={filtroClientes}
                          onChange={(e) => setFiltroClientes(e.target.value)}
                          className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900"
                          placeholder="Buscar por nome..."
                        />
                      </div>
                    </div>

                    {clientesFiltrados.length > 0 ? (
                      <div className="w-full overflow-y-auto mb-4 max-h-[350px] pr-1">
                        <ul className="divide-y divide-gray-100 w-full">
                          {clientesFiltrados.map((cliente) => (
                            <li key={cliente.id} className="py-1">
                              <button
                                onClick={() => selecionarCliente(cliente)}
                                className="w-full px-4 py-3 flex flex-col items-start hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <span className="font-medium text-gray-800">
                                  {cliente.nome}
                                </span>
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-sm text-gray-500">
                                    {cliente.cpfcnpj}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                    {cliente.tipoCliente === "matriz"
                                      ? "Matriz"
                                      : "Filiado"}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Nenhum cliente encontrado
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setModalAberto(false)}
                      className="mt-4 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Fechar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Busca de Matriz (para clientes filiados) */}
      <AnimatePresence>
        {modalMatrizAberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => !carregandoMatriz && setModalMatrizAberto(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center max-h-[600px]">
                {carregandoMatriz ? (
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
                      Buscando matrizes
                    </h3>
                    <p className="text-gray-500 text-sm text-center">
                      Aguarde enquanto localizamos as matrizes disponíveis...
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-emerald-700 mb-4 self-start">
                      Selecione uma Matriz
                    </h3>

                    <div className="w-full mb-4">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={filtroMatriz}
                          onChange={(e) => setFiltroMatriz(e.target.value)}
                          className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900"
                          placeholder="Buscar matriz por nome..."
                        />
                      </div>
                    </div>

                    {matrizFiltradas.length > 0 ? (
                      <div className="w-full overflow-y-auto mb-4 max-h-[350px] pr-1">
                        <ul className="divide-y divide-gray-100 w-full">
                          {matrizFiltradas.map((matriz) => (
                            <li key={matriz.id}>
                              <button
                                onClick={() => selecionarMatriz(matriz)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50 rounded-lg transition-colors group"
                              >
                                <span className="font-medium text-gray-800">
                                  {matriz.nome}
                                </span>
                                <FiCheck className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Nenhuma matriz encontrada
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setModalMatrizAberto(false)}
                      className="mt-4 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Fechar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {modalExclusaoAberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => !excluindo && setModalExclusaoAberto(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
                <div className="w-16 h-16 mb-4 text-red-500 flex items-center justify-center rounded-full bg-red-50">
                  <FiAlertCircle className="text-3xl" />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Confirmar Exclusão
                </h3>

                <p className="text-center text-gray-600 mb-6">
                  Tem certeza que deseja excluir o cliente{" "}
                  <span className="font-medium">
                    {clienteSelecionado?.nome}
                  </span>
                  ? Esta ação não pode ser desfeita.
                </p>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setModalExclusaoAberto(false)}
                    disabled={excluindo}
                    className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleExcluirCliente}
                    disabled={excluindo}
                    className="flex-1 px-5 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {excluindo ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
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
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <FiTrash2 />
                        Excluir
                      </>
                    )}
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

export default PainelEditarCliente;
