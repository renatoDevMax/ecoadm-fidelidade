"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FiTable,
  FiLoader,
  FiFileText,
  FiGrid,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import React from "react";

interface TabelaExcelProps {
  file: File | null;
}

interface DadosExcel {
  colunas: string[];
  linhas: any[][];
  totalLinhas: number;
}

const TabelaExcel = ({ file }: TabelaExcelProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosExcel | null>(null);
  const [exibirTabelaProdutos, setExibirTabelaProdutos] =
    useState<boolean>(false);

  useEffect(() => {
    if (!file) {
      setDados(null);
      setExibirTabelaProdutos(false);
      return;
    }

    const processarExcel = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Pega a primeira planilha
        const worksheet = workbook.Sheets[sheetName];

        // Converter para um array de arrays (matriz)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          throw new Error("Arquivo Excel está vazio ou não tem formato válido");
        }

        // Primeira linha como cabeçalho
        const colunas = jsonData[0] as string[];

        // Restante das linhas são os dados
        const linhas = jsonData.slice(1) as any[][];

        setDados({
          colunas,
          linhas,
          totalLinhas: linhas.length,
        });

        // Exibir automaticamente a tabela de produtos
        setExibirTabelaProdutos(true);
      } catch (err) {
        console.error("Erro ao processar arquivo Excel:", err);
        setError(
          "Não foi possível ler o arquivo Excel. Verifique se o formato é válido."
        );
      } finally {
        setLoading(false);
      }
    };

    processarExcel();
  }, [file]);

  if (!file) {
    return null;
  }

  return (
    <>
      {loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 bg-white rounded-xl shadow-sm p-10 flex justify-center items-center"
        >
          <FiLoader className="animate-spin text-indigo-600 mr-2" size={24} />
          <span className="text-gray-600">Processando arquivo Excel...</span>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 bg-white rounded-xl shadow-sm p-5 text-red-600"
        >
          {error}
        </motion.div>
      ) : null}

      <AnimatePresence>
        {exibirTabelaProdutos && dados && (
          <TabelaProdutosSimplificada
            dados={dados}
            fileName={file.name}
            fileSize={file.size}
            onClose={() => setExibirTabelaProdutos(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Função auxiliar para formatar o tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Componente para a tabela de produtos simplificada
interface TabelaProdutosSimplificadaProps {
  dados: DadosExcel;
  fileName: string;
  fileSize: number;
  onClose: () => void;
}

const TabelaProdutosSimplificada = ({
  dados,
  fileName,
  fileSize,
  onClose,
}: TabelaProdutosSimplificadaProps): React.ReactElement => {
  // Estado para controlar o processo de atualização dos preços
  const [atualizandoPrecos, setAtualizandoPrecos] = useState(false);
  const [progressoAtualizacao, setProgressoAtualizacao] = useState(0);
  const [linhasProdutos, setLinhasProdutos] = useState<any[]>([]);
  const [colunasFiltradas, setColunasFiltradas] = useState<any[]>([]);
  const [linhasFiltradas, setLinhasFiltradas] = useState<any[][]>([]);

  // Encontrar o índice da linha que contém "CÓDIGO" ou similar
  useEffect(() => {
    const cabecalhoIndex = dados.linhas.findIndex((linha) => {
      return linha.some(
        (celula) =>
          celula &&
          typeof celula === "string" &&
          celula.toString().toUpperCase().includes("CÓDIGO")
      );
    });

    // Se encontrou o cabeçalho, usar a linha do cabeçalho e todas as seguintes
    if (cabecalhoIndex >= 0) {
      const cabecalho = dados.linhas[cabecalhoIndex];

      // Encontrar os índices das colunas desejadas
      const colunasTemp: any[] = [];
      const indicesTemp: number[] = [];

      cabecalho.forEach((coluna, index) => {
        const colunaStr = coluna ? coluna.toString().toUpperCase() : "";
        if (
          colunaStr.includes("CÓDIGO") ||
          colunaStr.includes("DESCRI") ||
          colunaStr.includes("VL. UNIT")
        ) {
          colunasTemp.push(coluna);
          indicesTemp.push(index);
        }
      });

      // Filtrar as linhas para incluir apenas as colunas desejadas
      // Pula a primeira linha após o cabeçalho (começa do índice +2)
      const linhasTemp = dados.linhas.slice(cabecalhoIndex + 2).map((linha) => {
        return indicesTemp.map((indice) => linha[indice]);
      });

      // Atualizar os estados
      setColunasFiltradas(colunasTemp);
      setLinhasFiltradas(linhasTemp);

      // Preparar dados formatados para atualização de preços
      const produtosFormatados = linhasTemp.map((linha) => {
        // Assumindo que a ordem é: CÓDIGO, DESCRIÇÃO, VL. UNITÁRIO
        return {
          codigo: linha[0] ? linha[0].toString() : "",
          descricao: linha[1] ? linha[1].toString() : "",
          preco: linha[2]
            ? parseFloat(linha[2].toString().replace(",", "."))
            : 0,
          status: "",
        };
      });

      setLinhasProdutos(produtosFormatados);
    }
  }, [dados]);

  // Função para atualizar o preço de um produto específico
  const atualizarPrecoProduto = async (codigo: string, preco: number) => {
    try {
      const response = await fetch("/api/produtos/atualizar-preco", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo, preco }),
      });

      // Verificar o tipo de conteúdo antes de tentar fazer o parse do JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return {
          success: false,
          message: "Produto não encontrado",
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        return {
          success: false,
          message: "Produto não encontrado",
        };
      }

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, message: "Produto não encontrado" };
        }
        return { success: false, message: data.message || "Erro desconhecido" };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, message: "Erro de conexão" };
    }
  };

  // Função para processar as atualizações de preços em lote
  const processarAtualizacaoPrecos = async () => {
    if (linhasProdutos.length === 0) {
      toast.error("Nenhum produto para atualizar");
      return;
    }

    setAtualizandoPrecos(true);
    setProgressoAtualizacao(0);

    try {
      // Criar uma cópia das linhas para atualizar o status
      const produtosAtualizados = [...linhasProdutos].map((produto) => ({
        ...produto,
        status: "processando",
      }));

      setLinhasProdutos(produtosAtualizados);

      // Variáveis para contar os resultados
      let totalAtualizados = 0;
      let totalNaoEncontrados = 0;
      let totalErros = 0;

      // Processar cada produto
      for (let i = 0; i < produtosAtualizados.length; i++) {
        // Atualizar o progresso
        setProgressoAtualizacao(
          Math.floor((i / produtosAtualizados.length) * 100)
        );

        const produto = produtosAtualizados[i];

        // Verificar se o código existe
        if (!produto.codigo || produto.codigo === "-") {
          produtosAtualizados[i] = {
            ...produtosAtualizados[i],
            status: "nao_encontrado",
            mensagem: "Código inválido",
          };
          setLinhasProdutos([...produtosAtualizados]);
          totalNaoEncontrados++;
          continue;
        }

        // Verificar se o preço é válido
        if (isNaN(produto.preco) || produto.preco <= 0) {
          produtosAtualizados[i] = {
            ...produtosAtualizados[i],
            status: "nao_encontrado",
            mensagem: "Preço inválido",
          };
          setLinhasProdutos([...produtosAtualizados]);
          totalNaoEncontrados++;
          continue;
        }

        // Atualizar o preço no banco
        const resultado = await atualizarPrecoProduto(
          produto.codigo,
          produto.preco
        );

        // Atualizar o status do produto baseado no resultado
        if (resultado.success) {
          produtosAtualizados[i] = {
            ...produtosAtualizados[i],
            status: "atualizado",
            mensagem: "Atualizado com sucesso",
          };
          totalAtualizados++;
        } else if (resultado.message === "Produto não encontrado") {
          produtosAtualizados[i] = {
            ...produtosAtualizados[i],
            status: "nao_encontrado",
            mensagem: "Produto não encontrado",
          };
          totalNaoEncontrados++;
        } else {
          produtosAtualizados[i] = {
            ...produtosAtualizados[i],
            status: "erro",
            mensagem: resultado.message || "Erro desconhecido",
          };
          totalErros++;
        }

        setLinhasProdutos([...produtosAtualizados]);

        // Pequena pausa para não sobrecarregar o servidor
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Completar o progresso
      setProgressoAtualizacao(100);

      // Exibir resultados apenas uma vez ao final do processo
      if (totalAtualizados > 0) {
        toast.success(
          `${totalAtualizados} produto(s) atualizado(s) com sucesso!`
        );
      }

      if (totalNaoEncontrados > 0) {
        toast.error(`${totalNaoEncontrados} produto(s) não encontrado(s)`);
      }

      if (totalErros > 0) {
        toast.error(`${totalErros} produto(s) com erro de atualização`);
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar os preços");
    } finally {
      setAtualizandoPrecos(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-indigo-100"
    >
      <div className="p-5 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-indigo-900 flex items-center">
            <FiFileText className="mr-2" size={20} />
            Produtos da Nota Fiscal
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {fileName} ({formatFileSize(fileSize)})
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-indigo-100 rounded-full text-indigo-700 transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      <div className="p-5">
        {linhasFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  {colunasFiltradas.map((coluna, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider"
                    >
                      {coluna || `Coluna ${index + 1}`}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {linhasFiltradas.map((linha, rowIndex) => {
                  const statusProduto = linhasProdutos[rowIndex]?.status || "";

                  return (
                    <tr
                      key={rowIndex}
                      className={
                        statusProduto === "atualizado"
                          ? "bg-green-50"
                          : statusProduto === "nao_encontrado"
                          ? "bg-red-50"
                          : statusProduto === "processando"
                          ? "bg-blue-50"
                          : rowIndex % 2 === 0
                          ? "bg-white"
                          : "bg-indigo-50/30"
                      }
                    >
                      {linha.map((celula, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                        >
                          {celula !== undefined && celula !== null
                            ? cellIndex === 2 &&
                              !isNaN(parseFloat(celula.toString()))
                              ? parseFloat(celula.toString()).toFixed(2)
                              : celula.toString()
                            : ""}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {statusProduto === "atualizado" && (
                          <span className="text-green-600">Atualizado</span>
                        )}
                        {statusProduto === "nao_encontrado" && (
                          <span className="text-red-600">Não encontrado</span>
                        )}
                        {statusProduto === "processando" && (
                          <span className="text-blue-600">Processando...</span>
                        )}
                        {statusProduto === "erro" && (
                          <span className="text-red-600">Não encontrado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10 text-gray-500">
            Não foi possível identificar a tabela de produtos no arquivo.
          </div>
        )}

        {/* Barra de progresso (visível apenas durante a atualização) */}
        {atualizandoPrecos && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressoAtualizacao}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              Atualizando produtos... {progressoAtualizacao}%
            </p>
          </div>
        )}

        {/* Botão para atualizar preços */}
        <div className="mt-6 flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${
              atualizandoPrecos
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white py-3 px-6 rounded-lg text-lg font-medium shadow-md flex items-center gap-2 transition-colors duration-300`}
            onClick={processarAtualizacaoPrecos}
            disabled={atualizandoPrecos}
          >
            {atualizandoPrecos ? (
              <>
                <FiLoader className="animate-spin" size={20} />
                <span>Atualizando Preços...</span>
              </>
            ) : (
              <>
                <FiRefreshCw size={20} />
                <span>Atualizar Preços dos Produtos Online</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default TabelaExcel;
