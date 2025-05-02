"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiUpload,
  FiLoader,
  FiGrid,
  FiChevronRight,
  FiCheck,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import TabelaExcel from "./TabelaExcel";

// Interface para linhas da tabela com status de atualização
interface LinhaFormatada {
  primeiroValor: string;
  textoInicial: string;
  antepenultimoNumero: string;
  penultimoNumero: string;
  ultimoNumero: string;
  status?: string; // Mudando para string simples
}

const PainelAtualizarValores = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [mostrarTabela, setMostrarTabela] = useState<boolean>(false);
  const [linhasFormatadas, setLinhasFormatadas] = useState<LinhaFormatada[]>(
    []
  );
  const [atualizandoPrecos, setAtualizandoPrecos] = useState<boolean>(false);
  const [progressoAtualizacao, setProgressoAtualizacao] = useState<number>(0);

  // Carrega a biblioteca PDF.js apenas no cliente
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== "undefined") {
        try {
          const pdfjs = await import("pdfjs-dist");
          // Configurar o worker para usar o arquivo local
          pdfjs.GlobalWorkerOptions.workerSrc =
            "/pdf-worker/pdf.worker.min.mjs";
          setPdfjsLib(pdfjs);
        } catch (err) {
          console.error("Erro ao carregar PDF.js:", err);
          setError(
            "Não foi possível carregar o leitor de PDF. Por favor, recarregue a página."
          );
        }
      }
    };

    loadPdfJs();
  }, []);

  const handleLerPDF = () => {
    fileInputRef.current?.click();
  };

  const handleLerExcel = () => {
    excelInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !pdfjsLib) return;

    const file = files[0];
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setAviso(null);
    setMostrarTabela(false); // Resetar a visualização da tabela durante o processamento

    try {
      // Lê o arquivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Carrega o PDF usando pdf.js
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;

      // Extrair texto de todas as páginas
      let extractedText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Juntar todas as partes de texto
        const pageText = textContent.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");

        extractedText += pageText + "\n\n";
      }

      // Procura a string específica e extrai apenas o texto após ela
      // Usar uma abordagem mais flexível, pois a extração pode adicionar espaços extras
      const marcadorPadrao = "Total Quant Itens do Orçamento Ordem";

      // Procurar por variações da string (considerando espaços extras ou parciais)
      const stringsPossíveis = [
        "Total Quant Itens do Orçamento Ordem",
        "Quant Itens do Orçamento Ordem",
        "VL. Total Quant Itens do Orçamento Ordem",
        "VL.Total Quant Itens",
        "Total Quant Itens",
        "Produto Código VL. Unit VL. Total Quant Itens do Orçamento Ordem",
      ];

      let encontrouString = false;
      let textoFiltrado = "";

      // Procurar cada variação possível
      for (const strBusca of stringsPossíveis) {
        const posicaoMarcador = extractedText.indexOf(strBusca);
        if (posicaoMarcador !== -1) {
          // Encontrou uma das variações
          textoFiltrado = extractedText.substring(
            posicaoMarcador + strBusca.length
          );
          encontrouString = true;
          break;
        }
      }

      // Também tentar uma busca menos restritiva se ainda não encontrou
      if (!encontrouString) {
        // Buscar a sequência "Produto Código" seguida de alguma coisa e depois "Ordem"
        const match = extractedText.match(/Produto\s+Código.*?Ordem/i);
        if (match && match.index !== undefined) {
          const posicaoMarcador = match.index + match[0].length;
          textoFiltrado = extractedText.substring(posicaoMarcador);
          encontrouString = true;
        }

        // Buscar padrões específicos de PDFs de orçamento
        if (!encontrouString) {
          // Procurar padrões como códigos de produtos, valores R$ ou itens numerados
          const padroes = [
            /R\$\s*\d+[\d,.]+\s+R\$\s*\d+[\d,.]+/i, // Padrão de valores R$ seguidos
            /\d{4}\s+\d+[\d,.]*\s+R\$\s*\d+[\d,.]+/i, // Código de produto seguido de quantidade e valor
            /Itens\s+do\s+Orçamento/i, // Texto que geralmente aparece em orçamentos
            /Produto\s+Código/i, // Cabeçalho de tabela de produtos
          ];

          for (const padrao of padroes) {
            const match = extractedText.match(padrao);
            if (match && match.index !== undefined) {
              // Encontrar o início da linha onde o padrão foi encontrado
              const linhaAnterior = extractedText
                .substring(0, match.index)
                .lastIndexOf("\n");
              const inicioLinha = linhaAnterior !== -1 ? linhaAnterior + 1 : 0;
              textoFiltrado = extractedText.substring(inicioLinha);
              encontrouString = true;
              break;
            }
          }
        }
      }

      // Se encontrou algum dos padrões, tenta refinar ainda mais para isolar a tabela de produtos
      if (encontrouString) {
        // Verificar se o texto contém "Total dos Produtos" e remover tudo a partir dela
        const posicaoTotalProdutos =
          textoFiltrado.indexOf("Total dos Produtos");
        if (posicaoTotalProdutos !== -1) {
          // Cortar o texto para manter apenas o que vem antes de "Total dos Produtos"
          textoFiltrado = textoFiltrado.substring(0, posicaoTotalProdutos);
        }

        // Formatar o texto para garantir que cada item esteja em uma linha separada
        // Usar regex para adicionar quebras de linha após padrões que indicam o fim de um item
        const padraoFimItem = /([\d]+,[\d]{3})/g;
        let textoFormatado = textoFiltrado.replace(padraoFimItem, "$1\n");
        textoFormatado = textoFormatado.replace(/\n+/g, "\n").trim(); // Limpar quebras de linha duplicadas

        // Dividir em linhas para remover o segundo R$ de cada linha
        let linhasProcessadas = textoFormatado.split("\n");

        // Processar cada linha para remover o segundo R$
        linhasProcessadas = linhasProcessadas.map((linha) => {
          // Encontrar o primeiro R$
          const primeiroR$ = linha.indexOf("R$");

          if (primeiroR$ !== -1) {
            // Encontrar o espaço após o primeiro R$
            const espacoAposPrimeiroR$ = linha.indexOf(" ", primeiroR$ + 3);

            if (espacoAposPrimeiroR$ !== -1) {
              // Encontrar o segundo R$ após o primeiro
              const segundoR$ = linha.indexOf("R$", espacoAposPrimeiroR$ + 1);

              if (segundoR$ !== -1) {
                // Encontrar o próximo espaço após o segundo R$
                let espacoAposSegundoR$ = linha.indexOf(" ", segundoR$ + 3);

                // Se não encontrar espaço após o segundo R$, use o fim da linha
                if (espacoAposSegundoR$ === -1) {
                  espacoAposSegundoR$ = linha.length;
                }

                // Remover o segundo R$ e seu valor
                return (
                  linha.substring(0, segundoR$) +
                  (espacoAposSegundoR$ < linha.length
                    ? linha.substring(espacoAposSegundoR$)
                    : "")
                );
              }
            }
          }

          return linha;
        });

        // Juntar novamente as linhas após remover o segundo R$
        textoFormatado = linhasProcessadas.join("\n");

        // Salvar o texto processado
        setPdfText(textoFormatado);

        // Após processar o PDF, processar automaticamente para gerar a tabela
        processarTextoParaTabela(textoFormatado);
      } else {
        // Nenhuma das variações foi encontrada
        setPdfText(extractedText);
        setAviso(
          "Não foi possível identificar a seção de itens do orçamento. Exibindo texto completo."
        );
      }
    } catch (err) {
      console.error("Erro ao processar o PDF:", err);
      setError(
        "Não foi possível ler o conteúdo do PDF. Verifique se o arquivo é válido."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedExcelFile(file);
    // Aqui no futuro pode ser implementada a lógica para processar o Excel
  };

  // Função para processar o texto e destacar partes da linha
  const processarTextoParaTabela = (texto: string = pdfText) => {
    // Dividir o texto em linhas
    const linhas = texto.split("\n");

    // Debugar as linhas para ver exatamente o que estamos processando
    console.log("Linhas para processamento:", linhas);

    // Para cada linha, extrair seus componentes para exibição na tabela
    const novasLinhas = linhas.map((linha) => {
      // Extrair o primeiro valor monetário (R$ e o valor)
      let primeiroValor = "";
      let textoRestante = linha;

      // Encontrar o primeiro R$
      const primeiroR$ = linha.indexOf("R$");

      if (primeiroR$ !== -1) {
        // Encontrar o espaço após o valor do primeiro R$
        const espacoAposValor = linha.indexOf(" ", primeiroR$ + 3); // +3 para pular "R$ "

        if (espacoAposValor !== -1) {
          // Extrair o primeiro valor monetário
          primeiroValor = linha.substring(primeiroR$, espacoAposValor);
          // Remover o primeiro valor do texto restante para evitar duplicação
          textoRestante = linha.substring(espacoAposValor + 1).trim();
        } else {
          // Se não houver espaço após o valor, todo o resto é o valor
          primeiroValor = linha.substring(primeiroR$);
          textoRestante = ""; // Não sobra texto
        }
      }

      // Processar o texto restante para extrair as últimas três palavras
      // Dividir o texto por espaços para identificar todas as palavras
      const palavras = textoRestante.split(" ").filter((p) => p.trim() !== "");

      // Se tivermos pelo menos 3 palavras, extraímos as últimas 3
      if (palavras.length >= 3) {
        const ultimoNumero = palavras[palavras.length - 1];
        const penultimoNumero = palavras[palavras.length - 2];
        const antepenultimoNumero = palavras[palavras.length - 3];

        // O texto inicial são todas as palavras exceto as últimas 3
        const textoInicial = palavras.slice(0, palavras.length - 3).join(" ");

        // Logar para debugging
        console.log(
          `Linha processada: Preço=${primeiroValor}, Código=${antepenultimoNumero}, Seq=${penultimoNumero}, Qtd=${ultimoNumero}`
        );

        return {
          primeiroValor,
          textoInicial,
          antepenultimoNumero,
          penultimoNumero,
          ultimoNumero,
        };
      } else if (palavras.length === 2) {
        // Se tivermos apenas 2 palavras
        console.log(`Linha com apenas 2 palavras: ${palavras.join(" ")}`);
        return {
          primeiroValor,
          textoInicial: "",
          antepenultimoNumero: "",
          penultimoNumero: palavras[0],
          ultimoNumero: palavras[1],
        };
      } else if (palavras.length === 1) {
        // Se tivermos apenas 1 palavra
        console.log(`Linha com apenas 1 palavra: ${palavras[0]}`);
        return {
          primeiroValor,
          textoInicial: "",
          antepenultimoNumero: "",
          penultimoNumero: "",
          ultimoNumero: palavras[0],
        };
      }

      // Se não tem palavras
      console.log(`Linha sem palavras após preço: ${linha}`);
      return {
        primeiroValor,
        textoInicial: "",
        antepenultimoNumero: "",
        penultimoNumero: "",
        ultimoNumero: "",
      };
    });

    // Filtrar linhas vazias
    const linhasFiltradas = novasLinhas.filter(
      (linha) =>
        linha.textoInicial.trim() !== "" ||
        linha.antepenultimoNumero ||
        linha.penultimoNumero ||
        linha.ultimoNumero ||
        linha.primeiroValor
    );

    setLinhasFormatadas(linhasFiltradas);
    setMostrarTabela(true);
  };

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
        // Produto não encontrado ou outro erro, apenas retornar status sem logar erro
        return {
          success: false,
          message: "Produto não encontrado",
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Erro ao processar JSON, apenas retornar status sem logar erro
        return {
          success: false,
          message: "Produto não encontrado",
        };
      }

      if (!response.ok) {
        // Se for erro 404 (produto não encontrado), retornamos false sem mostrar erro
        if (response.status === 404) {
          return { success: false, message: "Produto não encontrado" };
        }

        // Para outros erros, também tratamos silenciosamente
        return { success: false, message: data.message || "Erro desconhecido" };
      }

      return { success: true, data };
    } catch (error) {
      // Tratar qualquer erro de conexão silenciosamente
      return { success: false, message: "Erro de conexão" };
    }
  };

  // Função para processar as atualizações de preços em lote
  const processarAtualizacaoPrecos = async () => {
    if (linhasFormatadas.length === 0) {
      toast.error("Nenhum produto para atualizar");
      return;
    }

    setAtualizandoPrecos(true);
    setProgressoAtualizacao(0);

    try {
      // Criar uma cópia das linhas para atualizar o status
      const linhasAtualizadas = [...linhasFormatadas].map((linha) => ({
        ...linha,
        status: "processando",
      }));

      setLinhasFormatadas(linhasAtualizadas);

      // Variáveis para contar os resultados
      let totalAtualizados = 0;
      let totalNaoEncontrados = 0;
      let totalErros = 0;

      // Processar cada linha
      for (let i = 0; i < linhasAtualizadas.length; i++) {
        // Atualizar o progresso
        setProgressoAtualizacao(
          Math.floor((i / linhasAtualizadas.length) * 100)
        );

        const linha = linhasAtualizadas[i];

        // Extrair código e preço
        let codigo = linha.antepenultimoNumero;

        // Limpar o código para garantir que é apenas número (remover espaços, letras, etc.)
        codigo = codigo.replace(/\D/g, "");

        // Verificar se o código existe
        if (!codigo || codigo === "-") {
          const novaLinha = {
            ...linhasAtualizadas[i],
            status: "nao_encontrado",
            mensagem: "Código inválido",
          };
          linhasAtualizadas[i] = novaLinha;
          setLinhasFormatadas([...linhasAtualizadas]);
          totalNaoEncontrados++;
          continue;
        }

        // Extrair e converter o preço
        let preco = 0;
        if (linha.primeiroValor) {
          // Remover R$ e converter para número
          const precoTexto = linha.primeiroValor.replace("R$", "").trim();
          preco = parseFloat(precoTexto.replace(",", "."));
        }

        if (isNaN(preco) || preco <= 0) {
          const novaLinha = {
            ...linhasAtualizadas[i],
            status: "nao_encontrado",
            mensagem: "Preço inválido",
          };
          linhasAtualizadas[i] = novaLinha;
          setLinhasFormatadas([...linhasAtualizadas]);
          totalNaoEncontrados++;
          continue;
        }

        // Atualizar o preço no banco
        const resultado = await atualizarPrecoProduto(codigo, preco);

        // Atualizar o status da linha baseado no resultado
        let novoStatus;
        let novaMensagem;

        if (resultado.success) {
          novoStatus = "atualizado";
          novaMensagem = "Atualizado com sucesso";
          totalAtualizados++;
        } else if (resultado.message === "Produto não encontrado") {
          novoStatus = "nao_encontrado";
          novaMensagem = "Produto não encontrado";
          totalNaoEncontrados++;
        } else {
          novoStatus = "erro";
          novaMensagem = resultado.message || "Erro desconhecido";
          totalErros++;
        }

        const novaLinha = {
          ...linhasAtualizadas[i],
          status: novoStatus,
          mensagem: novaMensagem,
        };

        linhasAtualizadas[i] = novaLinha;
        setLinhasFormatadas([...linhasAtualizadas]);

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
      // Capturar qualquer erro, mas não exibir no console
      toast.error("Ocorreu um erro ao atualizar os preços");
    } finally {
      setAtualizandoPrecos(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-indigo-900 mb-2"
        >
          Atualizar Valores
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.1 } }}
          className="text-gray-600"
        >
          Atualize automaticamente os valores dos produtos a partir de
          documentos
        </motion.p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <FiFileText className="mx-auto text-indigo-600 mb-3" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Importação de Orçamentos
            </h2>
            <p className="text-gray-600">
              Importe arquivos PDF de orçamentos para atualizar automaticamente
              os valores dos produtos
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={handleLerPDF}
              disabled={isLoading || !pdfjsLib}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              {!pdfjsLib ? (
                "Carregando..."
              ) : isLoading ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <FiUpload />
                  <span>Ler PDF de Orçamento</span>
                </>
              )}
            </button>

            <button
              onClick={handleLerExcel}
              disabled={isLoading}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <FiUpload />
                  <span>Ler Excel de Entrada</span>
                </>
              )}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />

            <input
              type="file"
              ref={excelInputRef}
              onChange={handleExcelFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
          </div>

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-gray-100 rounded-lg text-center w-full"
            >
              <p className="text-sm text-gray-800 mb-2">
                Arquivo PDF:{" "}
                <span className="font-medium">{selectedFile.name}</span>
              </p>
            </motion.div>
          )}

          {selectedExcelFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-emerald-50 rounded-lg text-center w-full"
            >
              <p className="text-sm text-gray-800 mb-2">
                Arquivo Excel:{" "}
                <span className="font-medium">{selectedExcelFile.name}</span>
              </p>
            </motion.div>
          )}

          {/* Componente de Tabela Excel */}
          {selectedExcelFile && <TabelaExcel file={selectedExcelFile} />}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {aviso && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg"
            >
              {aviso}
            </motion.div>
          )}

          {mostrarTabela &&
            linhasFormatadas.length > 0 &&
            !isLoading &&
            !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6"
              >
                <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
                  <FiGrid className="mr-2" size={20} />
                  Tabela de Produtos
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4">
                    {/* Cabeçalho da Tabela */}
                    <div className="grid grid-cols-5 gap-3 font-medium text-gray-700 pb-2 mb-3 border-b border-gray-200">
                      <div>Preço</div>
                      <div>Produto</div>
                      <div>Código</div>
                      <div>Seq.</div>
                      <div>Quant.</div>
                    </div>

                    {/* Corpo da Tabela */}
                    {linhasFormatadas.map((linha, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-5 gap-3 py-2 border-b border-gray-100 last:border-0 items-center ${
                          linha.status === "atualizado"
                            ? "bg-green-50"
                            : linha.status === "nao_encontrado"
                            ? "bg-red-50"
                            : linha.status === "processando"
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="text-orange-500 font-medium">
                          {linha.primeiroValor || "-"}
                        </div>
                        <div className="text-gray-800 truncate">
                          {linha.textoInicial || "-"}
                        </div>
                        <div className="text-green-600 font-medium">
                          {linha.antepenultimoNumero || "-"}
                        </div>
                        <div className="text-blue-600 font-medium">
                          {linha.penultimoNumero || "-"}
                        </div>
                        <div className="text-red-600 font-medium">
                          {linha.ultimoNumero || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
              </motion.div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default PainelAtualizarValores;
