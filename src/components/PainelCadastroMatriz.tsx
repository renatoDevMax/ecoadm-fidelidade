"use client";

import { motion } from "framer-motion";
import {
  FiUser,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiMail,
  FiLock,
  FiPercent,
} from "react-icons/fi";
import { FormEvent, useState, ChangeEvent } from "react";
import { ClienteMatriz } from "../models/ClienteMatriz";
import { toast } from "react-hot-toast";
import { cadastrarClienteMatriz } from "../app/actions";

const PainelCadastroMatriz = () => {
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    };

    try {
      const resultado = await cadastrarClienteMatriz(dados);

      if (resultado.success) {
        console.log("Cliente cadastrado:", resultado.data);
        toast.success("Cadastro realizado com sucesso!");
        // Reset form
        (e.target as HTMLFormElement).reset();
        setBeneficios([]);
        setCpfCnpj("");
        setTelefone("");
      } else {
        console.error("Erro:", resultado.error);
        toast.error("Erro ao cadastrar. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      toast.error("Erro ao cadastrar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4"
    >
      <h2 className="text-3xl font-bold text-emerald-700 mb-8 flex items-center gap-3">
        <FiUser className="text-2xl" />
        Cadastro de Matriz
      </h2>

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
                        creditoPersonalizadoAtivo ? "opacity-100" : "opacity-0"
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
          className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiUser className="text-lg" />
          Cadastrar Matriz
        </button>
      </form>
    </motion.div>
  );
};

export default PainelCadastroMatriz;
