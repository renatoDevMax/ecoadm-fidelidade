"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiSearch,
  FiCheck,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiDownload,
  FiShare2,
} from "react-icons/fi";
import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { buscarTodosClientes } from "../app/actions";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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

const PainelCartaoFidelidade = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [gerando, setGerando] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const cartaoRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

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

  const gerarPDF = async (paraCompartilhar = false) => {
    if (!clienteSelecionado) return;

    if (paraCompartilhar) {
      setCompartilhando(true);
      toast.loading("Preparando para compartilhar...");
    } else {
      setGerando(true);
      toast.loading("Gerando PDF do cartão...");
    }

    try {
      // Dimensões do cartão em mm (tamanho padrão de cartão de crédito + os aumentos solicitados)
      // Conversão aproximada: 1mm ≈ 3.78px
      const cardWidth = 112; // 85mm (padrão) + ~26.5mm (100px)
      const cardHeight = 62; // 54mm (padrão) + ~8mm (30px)

      // Criar PDF em orientação paisagem, no tamanho do cartão
      const pdf = new jsPDF("l", "mm", [cardWidth, cardHeight]);

      // Função para compartilhar
      const compartilharPDFBlob = async (pdfBlob: Blob) => {
        try {
          // Verificar se a API Web Share está disponível
          if (navigator.share && navigator.canShare) {
            const arquivo = new File(
              [pdfBlob],
              `cartao-fidelidade-${clienteSelecionado.nome
                .toLowerCase()
                .replace(/\s+/g, "-")}.pdf`,
              { type: "application/pdf" }
            );

            // Verificar se podemos compartilhar arquivos
            if (navigator.canShare({ files: [arquivo] })) {
              await navigator.share({
                files: [arquivo],
                title: "Cartão de Fidelidade EcoClean",
                text: `Cartão de fidelidade de ${clienteSelecionado.nome}`,
              });
              toast.success("Compartilhado com sucesso!");
              return;
            }
          }

          // Fallback: Compartilhar via WhatsApp criando um link temporário
          const blobUrl = URL.createObjectURL(pdfBlob);

          // Preparar mensagem para WhatsApp
          const mensagem = encodeURIComponent(
            `Olá! Aqui está o cartão de fidelidade EcoClean para ${clienteSelecionado.nome}.\n\nAbra o PDF para visualizar:`
          );
          const whatsappUrl = `https://wa.me/?text=${mensagem}`;

          // Abrir o arquivo em uma nova aba e em seguida abrir WhatsApp
          window.open(blobUrl, "_blank");
          window.open(whatsappUrl, "_blank");

          toast.success(
            "PDF aberto! Use seu app de WhatsApp para compartilhar."
          );
        } catch (error) {
          console.error("Erro ao compartilhar:", error);
          toast.error(
            "Erro ao compartilhar. Tente fazer o download e compartilhar manualmente."
          );
        } finally {
          setCompartilhando(false);
        }
      };

      // Carregar a imagem de fundo
      const imgFundo = new Image();

      // Função para continuar após carregar a imagem
      const processarPDF = () => {
        try {
          // Adicionar a imagem de fundo
          pdf.addImage(imgFundo, "PNG", 0, 0, cardWidth, cardHeight);

          // Configurar estilo do texto
          pdf.setTextColor(255, 255, 255); // Texto branco

          // Título
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.text("EcoClean Fidelidade", 8, 10);

          // Configurações para o texto do cliente
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");

          // Informações do cliente
          pdf.setFontSize(7);
          pdf.setTextColor(220, 252, 231); // Cor emerald-100
          pdf.text("Nome do Cliente", 8, 16);

          // Ajuste dinâmico do tamanho da fonte baseado no comprimento do nome
          const nomeCliente = clienteSelecionado.nome;
          let tamanhoFonte = 12; // Tamanho padrão

          // Reduzir o tamanho da fonte para nomes longos
          if (nomeCliente.length > 25) {
            tamanhoFonte = 10;
          }
          if (nomeCliente.length > 35) {
            tamanhoFonte = 8;
          }

          pdf.setFontSize(tamanhoFonte);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
          pdf.text(nomeCliente, 8, 20);

          pdf.setFontSize(7);
          pdf.setTextColor(220, 252, 231);
          pdf.text("Documento", 8, 26);

          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text(clienteSelecionado.cpfcnpj, 8, 30);

          pdf.setFontSize(7);
          pdf.setTextColor(220, 252, 231);
          pdf.text("Tipo de Cliente", 8, 36);

          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text(
            clienteSelecionado.tipoCliente === "matriz"
              ? "Cliente Matriz"
              : "Cliente Filiado",
            8,
            40
          );

          pdf.setFontSize(7);
          pdf.setTextColor(220, 252, 231);
          pdf.text("Data de Cadastro", 8, 46);

          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text(formatarData(clienteSelecionado.dataCadastro), 8, 50);

          // Adicionar QR Code (se disponível)
          if (qrCodeRef.current) {
            try {
              // Capturar apenas o QR code
              const qrCanvas = html2canvas(qrCodeRef.current, {
                scale: 4,
                backgroundColor: null,
              });

              qrCanvas
                .then((canvas) => {
                  const qrImageData = canvas.toDataURL("image/png");
                  // Posicionar o QR code no lado direito
                  pdf.addImage(qrImageData, "PNG", cardWidth - 34, 14, 26, 26);

                  // Nome do arquivo com o nome do cliente
                  const filename = `cartao-fidelidade-${clienteSelecionado.nome
                    .toLowerCase()
                    .replace(/\s+/g, "-")}.pdf`;

                  if (paraCompartilhar) {
                    // Obter o PDF como Blob para compartilhar
                    const pdfBlob = pdf.output("blob");
                    compartilharPDFBlob(pdfBlob);
                  } else {
                    // Fazer download do PDF
                    pdf.save(filename);
                    toast.dismiss();
                    toast.success("Cartão baixado com sucesso!");
                    setGerando(false);
                  }
                })
                .catch((qrError) => {
                  console.error("Erro ao adicionar QR Code:", qrError);

                  if (paraCompartilhar) {
                    const pdfBlob = pdf.output("blob");
                    compartilharPDFBlob(pdfBlob);
                  } else {
                    // Se falhar ao adicionar o QR code, continua sem ele
                    const filename = `cartao-fidelidade-${clienteSelecionado.nome
                      .toLowerCase()
                      .replace(/\s+/g, "-")}.pdf`;
                    pdf.save(filename);
                    toast.dismiss();
                    toast.success("Cartão baixado com sucesso (sem QR code)!");
                    setGerando(false);
                  }
                });
            } catch (qrError) {
              console.error("Erro ao processar QR Code:", qrError);

              if (paraCompartilhar) {
                const pdfBlob = pdf.output("blob");
                compartilharPDFBlob(pdfBlob);
              } else {
                // Se falhar ao adicionar o QR code, continua sem ele
                const filename = `cartao-fidelidade-${clienteSelecionado.nome
                  .toLowerCase()
                  .replace(/\s+/g, "-")}.pdf`;
                pdf.save(filename);
                toast.dismiss();
                toast.success("Cartão baixado com sucesso (sem QR code)!");
                setGerando(false);
              }
            }
          } else {
            if (paraCompartilhar) {
              const pdfBlob = pdf.output("blob");
              compartilharPDFBlob(pdfBlob);
            } else {
              // Nome do arquivo com o nome do cliente
              const filename = `cartao-fidelidade-${clienteSelecionado.nome
                .toLowerCase()
                .replace(/\s+/g, "-")}.pdf`;
              pdf.save(filename);
              toast.dismiss();
              toast.success("Cartão baixado com sucesso!");
              setGerando(false);
            }
          }
        } catch (processingError) {
          console.error("Erro ao processar o PDF:", processingError);
          toast.dismiss();
          if (paraCompartilhar) {
            toast.error("Erro ao preparar o PDF para compartilhar");
            setCompartilhando(false);
          } else {
            toast.error("Erro ao gerar o PDF do cartão");
            setGerando(false);
          }
        }
      };

      // Carregar a imagem de fundo
      imgFundo.onload = processarPDF;
      imgFundo.onerror = () => {
        console.error("Erro ao carregar imagem de fundo");
        // Fallback para cor sólida
        pdf.setFillColor(16, 185, 129); // RGB para emerald-600
        pdf.rect(0, 0, cardWidth, cardHeight, "F");
        processarPDF();
      };

      // Carregar a imagem
      imgFundo.src = "/testefundo.png";
    } catch (error) {
      console.error("Erro ao iniciar a geração do PDF:", error);
      toast.dismiss();
      if (paraCompartilhar) {
        toast.error("Erro ao preparar o PDF para compartilhar");
        setCompartilhando(false);
      } else {
        toast.error("Erro ao gerar o PDF do cartão");
        setGerando(false);
      }
    }
  };

  const compartilharPDF = () => {
    if (!clienteSelecionado) return;
    gerarPDF(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-4"
      >
        <h2 className="text-3xl font-bold text-emerald-700 mb-8 flex items-center gap-3">
          <FiCreditCard className="text-2xl" />
          Cartão de Fidelidade
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
          {clienteSelecionado ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Cartão de Fidelidade */}
              <div
                ref={cartaoRef}
                className="fundocartao rounded-2xl shadow-xl overflow-hidden relative"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      EcoClean Fidelidade
                    </h3>
                    <FiCreditCard className="text-white text-3xl opacity-80" />
                  </div>

                  <div className="space-y-4 text-white max-w-[50%]">
                    <div>
                      <p className="text-emerald-100 text-xs">
                        Nome do Cliente
                      </p>
                      <p className="text-xl font-semibold">
                        {clienteSelecionado.nome}
                      </p>
                    </div>

                    <div>
                      <p className="text-emerald-100 text-xs">Documento</p>
                      <p className="font-medium">
                        {clienteSelecionado.cpfcnpj}
                      </p>
                    </div>

                    <div>
                      <p className="text-emerald-100 text-xs">
                        Tipo de Cliente
                      </p>
                      <p className="font-medium">
                        {clienteSelecionado.tipoCliente === "matriz"
                          ? "Cliente Matriz"
                          : "Cliente Filiado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-emerald-100 text-xs">
                        Data de Cadastro
                      </p>
                      <p className="font-medium">
                        {formatarData(clienteSelecionado.dataCadastro)}
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-[50px] right-[50px]">
                    <div className="p-2 bg-white rounded-md flex items-center justify-center">
                      <QRCode
                        value={clienteSelecionado.id}
                        size={120}
                        level="H"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações detalhadas do cliente */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-500 mb-1">
                      <FiMapPin className="mr-2" /> Endereço
                    </div>
                    <div className="font-medium text-gray-800">
                      {clienteSelecionado.endereco}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-gray-500 mb-1">
                      <FiPhone className="mr-2" /> Contato
                    </div>
                    <div className="font-medium text-gray-800">
                      {clienteSelecionado.contato}
                    </div>
                  </div>

                  {clienteSelecionado.matriz && (
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 mb-1">
                        <FiUser className="mr-2" /> Matriz Associada
                      </div>
                      <div className="font-medium text-gray-800">
                        {clienteSelecionado.matriz}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center text-gray-500 mb-1">
                      Benefícios Disponíveis
                    </div>
                    <ul className="space-y-1">
                      {clienteSelecionado.beneficios.map((beneficio, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-gray-800"
                        >
                          <span className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                            <FiCheck size={12} />
                          </span>
                          {beneficio}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botão para imprimir ou compartilhar o cartão */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => gerarPDF(false)}
                  disabled={gerando || compartilhando}
                >
                  {gerando ? (
                    "Gerando PDF..."
                  ) : (
                    <>
                      <FiDownload className="text-lg" />
                      Baixar Cartão
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="flex-1 border border-emerald-600 text-emerald-600 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  onClick={compartilharPDF}
                  disabled={gerando || compartilhando}
                >
                  {compartilhando ? (
                    "Preparando..."
                  ) : (
                    <>
                      <FiShare2 className="text-lg" />
                      Compartilhar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <FiUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum cliente selecionado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um cliente para gerar o cartão de fidelidade.
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

      {/* QR Code ref - invisível, apenas para captura */}
      <div style={{ position: "absolute", left: "-9999px" }} ref={qrCodeRef}>
        <div className="p-2 bg-white rounded-md flex items-center justify-center">
          <QRCode value={clienteSelecionado?.id || ""} size={120} level="H" />
        </div>
      </div>
    </>
  );
};

export default PainelCartaoFidelidade;
