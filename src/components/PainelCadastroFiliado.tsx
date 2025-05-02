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
  FiMail,
  FiLock,
  FiPercent,
} from "react-icons/fi";
import { FormEvent, useState, ChangeEvent } from "react";
import { toast } from "react-hot-toast";
import { buscarClientesMatriz, cadastrarClienteFiliado } from "../app/actions";

// Definindo o tipo para os clientes matriz
type ClienteMatriz = {
  id: string;
  nome: string;
  beneficios: string[];
};

const PainelCadastroFiliado = () => {
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [clientesMatriz, setClientesMatriz] = useState<ClienteMatriz[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [matrizSelecionada, setMatrizSelecionada] =
    useState<ClienteMatriz | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [filtroMatriz, setFiltroMatriz] = useState("");
  const [creditoPersonalizadoAtivo, setCreditoPersonalizadoAtivo] =
    useState(false);
  const [percentualCredito, setPercentualCredito] = useState("0");

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
    // Para benefícios normais
    if (beneficio !== "Crédito Personalizado") {
      setBeneficios((prev) =>
        prev.includes(beneficio)
          ? prev.filter((b) => b !== beneficio)
          : [...prev, beneficio]
      );
    }
  };

  const toggleCreditoPersonalizado = () => {
    setCreditoPersonalizadoAtivo(!creditoPersonalizadoAtivo);

    // Remover qualquer benefício de crédito personalizado existente
    setBeneficios((prev) =>
      prev.filter((b) => !b.startsWith("Crédito personalizado de"))
    );

    // Adicionar novo benefício se estiver ativo
    if (!creditoPersonalizadoAtivo && percentualCredito) {
      setBeneficios((prev) => [
        ...prev,
        `Crédito personalizado de ${percentualCredito}%`,
      ]);
    }
  };

  const atualizarPercentualCredito = (valor: string) => {
    // Verificar se é um número válido
    if (valor === "" || /^\d+$/.test(valor)) {
      setPercentualCredito(valor);

      // Atualizar o benefício na lista se o crédito personalizado estiver ativo
      if (creditoPersonalizadoAtivo) {
        // Remover o antigo
        setBeneficios((prev) =>
          prev.filter((b) => !b.startsWith("Crédito personalizado de"))
        );

        // Adicionar o novo
        if (valor) {
          setBeneficios((prev) => [
            ...prev,
            `Crédito personalizado de ${valor}%`,
          ]);
        }
      }
    }
  };

  const abrirModal = async () => {
    setModalAberto(true);
    setCarregando(true);

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
      setCarregando(false);
    }
  };

  const selecionarMatriz = (cliente: ClienteMatriz) => {
    setMatrizSelecionada(cliente);
    setModalAberto(false);
    toast.success("Matriz selecionada com sucesso!");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!matrizSelecionada) {
      toast.error("Selecione uma matriz antes de cadastrar o filiado");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const dados = {
      nome: formData.get("nome") as string,
      cpfcnpj: cpfCnpj,
      endereco: formData.get("endereco") as string,
      contato: telefone,
      email: formData.get("email") as string,
      senha: formData.get("senha") as string,
      beneficios: beneficios,
      matriz: matrizSelecionada.nome,
      beneficioMatriz: matrizSelecionada.beneficios,
    };

    try {
      const resultado = await cadastrarClienteFiliado(dados);

      if (resultado.success) {
        toast.success("Filiado cadastrado com sucesso!");
        // Reset form
        (e.target as HTMLFormElement).reset();
        setBeneficios([]);
        setMatrizSelecionada(null);
        setCpfCnpj("");
        setTelefone("");
      } else {
        toast.error("Erro ao cadastrar filiado");
      }
    } catch (error) {
      console.error("Erro ao cadastrar filiado:", error);
      toast.error("Erro ao cadastrar filiado");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar matrizes pelo nome
  const matrizFiltradas = clientesMatriz.filter((matriz) =>
    matriz.nome.toLowerCase().includes(filtroMatriz.toLowerCase())
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4"
      >
        <h2 className="text-3xl font-bold text-emerald-700 mb-8 flex items-center gap-3">
          <FiUser className="text-2xl" />
          Cadastro de Filiado
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <button
              type="button"
              onClick={abrirModal}
              className="flex items-center justify-center gap-2 w-full bg-emerald-100 text-emerald-800 py-3 px-6 rounded-lg font-medium hover:bg-emerald-200 transition-colors border border-emerald-200"
            >
              <FiSearch className="text-lg" />
              Localizar Matriz
            </button>
          </div>

          {/* Exibir matriz selecionada */}
          {matrizSelecionada && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center"
            >
              <div className="bg-emerald-100 p-2 rounded-full mr-3">
                <FiHome className="text-emerald-600 text-lg" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Matriz Selecionada:
                </div>
                <div className="font-semibold text-emerald-700">
                  {matrizSelecionada.nome}
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nome"
                  className="w-full px-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Digite o nome completo"
                  required
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
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Digite o endereço completo"
                  required
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
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="exemplo@ecoclean.com.br"
                  required
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
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 placeholder-gray-500"
                  placeholder="Digite uma senha segura"
                  required
                />
              </div>
            </div>
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
                  className="flex items-center space-x-3 group cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-emerald-50"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={beneficios.includes(beneficio)}
                      onChange={() => toggleBeneficio(beneficio)}
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

              {/* Crédito Personalizado */}
              <div className="flex flex-col space-y-3 p-3 rounded-lg transition-all duration-200 hover:bg-emerald-50 border border-emerald-100">
                <label className="flex items-center space-x-3 group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={creditoPersonalizadoAtivo}
                      onChange={toggleCreditoPersonalizado}
                    />
                    <div className="w-5 h-5 border-2 border-emerald-300 rounded-md flex items-center justify-center transition-all group-hover:border-emerald-500">
                      <svg
                        className={`w-3 h-3 text-emerald-600 transition-opacity ${
                          creditoPersonalizadoAtivo
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
                  <span className="text-gray-700 font-medium">
                    Crédito Personalizado
                  </span>
                </label>

                {creditoPersonalizadoAtivo && (
                  <div className="flex items-center mt-2 pl-8">
                    <div className="relative flex-1">
                      <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={percentualCredito}
                        onChange={(e) =>
                          atualizarPercentualCredito(e.target.value)
                        }
                        className="w-full px-4 py-2 rounded-lg border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-900 pr-10"
                        placeholder="Percentual"
                      />
                    </div>
                    <span className="ml-2 text-gray-700">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !matrizSelecionada}
            className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              isSubmitting || !matrizSelecionada
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <FiUser className="text-lg" />
            {isSubmitting ? "Cadastrando..." : "Cadastrar Filiado"}
          </button>
        </form>
      </motion.div>

      {/* Modal de Busca */}
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
                      Buscando clientes matriz
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
                          {matrizFiltradas.map((cliente) => (
                            <li key={cliente.id}>
                              <button
                                onClick={() => selecionarMatriz(cliente)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50 rounded-lg transition-colors group"
                              >
                                <span className="font-medium text-gray-800">
                                  {cliente.nome}
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
    </>
  );
};

export default PainelCadastroFiliado;
